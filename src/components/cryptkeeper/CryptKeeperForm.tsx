// src/components/cryptkeeper/CryptKeeperForm.tsx
"use client";

import React, { useState, useRef, ChangeEvent, useEffect, DragEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { encryptData, decryptData } from '@/lib/crypto';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import { UploadCloud, Lock, Unlock, Loader2, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import CloudStorage from './CloudStorage';
import FileIntegrityChecker from './FileIntegrityChecker';

const compareArrayBuffers = (buf1: ArrayBuffer, buf2: ArrayBuffer): boolean => {
  if (buf1.byteLength !== buf2.byteLength) return false;
  const view1 = new Uint8Array(buf1);
  const view2 = new Uint8Array(buf2);
  for (let i = 0; i < view1.length; i++) {
    if (view1[i] !== view2[i]) {
      return false;
    }
  }
  return true;
};

export default function CryptKeeperForm() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operationSuccess, setOperationSuccess] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [encryptedBlob, setEncryptedBlob] = useState<Blob | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [processedSize, setProcessedSize] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile) {
        setFile(selectedFile);
        setEncryptedBlob(null);
        setOriginalSize(selectedFile.size);
        resetStatus();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files?.[0] || null);
  };
  
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelect(event.dataTransfer.files?.[0] || null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setEncryptedBlob(null);
    setOriginalSize(null);
    resetStatus();
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    toast({ title: "File removed", description: "The selected file has been cleared." });
  };

  const resetStatus = () => {
    setOperationError(null);
    setOperationSuccess(null);
    setProcessedSize(null);
  }

  const handleOperation = async (operationType: 'encrypt' | 'decrypt') => {
    if (!file) {
      toast({ title: "Error", description: "Please select a file.", variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: "Error", description: "Please enter a password.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    resetStatus();

    try {
      const arrayBuffer = await file.arrayBuffer();
      let resultBuffer: ArrayBuffer | null = null;
      let outputFileName: string = '';

      if (operationType === 'encrypt') {
        resultBuffer = await encryptData(arrayBuffer, password);
        outputFileName = `${file.name}.cptk`;
        
        // Post-encryption verification to ensure data integrity
        const decryptedForVerify = await decryptData(resultBuffer, password);
        if (!compareArrayBuffers(arrayBuffer, decryptedForVerify)) {
            throw new Error("Post-encryption verification failed. Data integrity could not be guaranteed.");
        }
        
        setOperationSuccess(`File "${file.name}" encrypted and compressed successfully as "${outputFileName}".\nVerification passed: No data loss detected.`);
      } else { // operationType === 'decrypt'
        resultBuffer = await decryptData(arrayBuffer, password);
        if (file.name.toLowerCase().endsWith('.cptk')) {
          outputFileName = file.name.slice(0, -5);
        } else {
          outputFileName = `${file.name}.decrypted`;
        }
        setOperationSuccess(`File "${file.name}" decrypted and decompressed successfully as "${outputFileName}".\nThe file's built-in integrity check passed.`);
      }
      
      if (resultBuffer) {
        const blob = new Blob([resultBuffer]);
        if (operationType === 'encrypt') {
            setEncryptedBlob(blob);
        }
        setProcessedSize(resultBuffer.byteLength);
        
        // Use a fallback method that works in all environments, including iframes
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = outputFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Success", description: `File ${operationType === 'encrypt' ? 'encrypted' : 'decrypted'} and download started.` });
      }

    } catch (err: any) {
      console.error(`${operationType} error:`, err);
      const errorMessage = err.message || `An unknown error occurred during ${operationType}.`;
      setOperationError(errorMessage);
      toast({ title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Failed`, description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getEncryptedBlob = () => {
    if (!encryptedBlob) {
        toast({ title: "No file encrypted", description: "Please encrypt a file first before uploading.", variant: "destructive" });
        return null;
    }
    return encryptedBlob;
  }
  
  const handleCloudFileSelect = (cloudFile: File) => {
    handleFileSelect(cloudFile);
    toast({ title: "File Loaded", description: `${cloudFile.name} is ready for decryption.` });
  };


  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-5xl font-extrabold tracking-tight">
          CryptKeeper
        </h1>
        <p className="text-muted-foreground">
          Welcome to the File Encryptor & Decryptor. <br />
          Encrypt your sensitive data or decrypt your secured files with ease.
        </p>
      </header>
      
      {operationError && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertCircle className="h-4 w-4" suppressHydrationWarning />
          <AlertTitle>Operation Failed</AlertTitle>
          <AlertDescription>{operationError}</AlertDescription>
        </Alert>
      )}
      {operationSuccess && (
         <Alert variant="default" className="animate-in fade-in-50 border-accent/50 text-accent dark:text-accent-foreground">
          <CheckCircle2 className="h-4 w-4 text-accent" suppressHydrationWarning />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription className="whitespace-pre-line">
            {operationSuccess}
            {originalSize !== null && processedSize !== null && (
              <div className="mt-3 text-foreground/80 border-t border-accent/20 pt-2 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Original Size:</span>
                  <span className="font-mono bg-white/10 dark:bg-black/20 px-1.5 py-0.5 rounded-sm">{formatBytes(originalSize)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">New Size:</span>
                  <span className="font-mono bg-white/10 dark:bg-black/20 px-1.5 py-0.5 rounded-sm">{formatBytes(processedSize)}</span>
                </div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-2xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl">Local File Operation</CardTitle>
          <CardDescription>Select a local file and enter a password to get started.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select File</Label>
            <div
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200",
                    isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-secondary/50"
                )}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <UploadCloud className={cn("w-10 h-10 mb-3", isDragging ? "text-primary" : "text-muted-foreground")} suppressHydrationWarning/>
                    <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">Any file type supported</p>
                </div>
                <Input id="file-upload" type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>
            {file && (
              <div className="mt-2 text-sm text-muted-foreground flex items-center justify-between p-2 pl-3 rounded-md bg-secondary border">
                <div className="flex items-center min-w-0">
                  <FileText className="w-4 h-4 mr-2 shrink-0" suppressHydrationWarning />
                  <span className="truncate">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-7 w-7 shrink-0" suppressHydrationWarning>
                  <X className="h-4 w-4" suppressHydrationWarning />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); resetStatus(); }}
              placeholder="Enter your secret password"
              className="text-base"
            />
          </div>
          <PasswordStrengthMeter password={password} />
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
          <Button
            onClick={() => handleOperation('encrypt')}
            disabled={isLoading || !file || !password}
            className="w-full sm:w-auto transition-transform transform hover:scale-105"
            size="lg"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" suppressHydrationWarning /> : <Lock className="mr-2 h-5 w-5" suppressHydrationWarning />}
            Encrypt File
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOperation('decrypt')}
            disabled={isLoading || !file || !password}
            className="w-full sm:w-auto transition-transform transform hover:scale-105"
            size="lg"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" suppressHydrationWarning /> : <Unlock className="mr-2 h-5 w-5" suppressHydrationWarning />}
            Decrypt File
          </Button>
        </CardFooter>
      </Card>
      
      <CloudStorage onFileSelect={handleCloudFileSelect} getEncryptedBlob={getEncryptedBlob} file={file} />

      <FileIntegrityChecker />

      <footer className="text-center text-sm text-muted-foreground mt-12">
        <p>&copy; {currentYear} CryptKeeper. Secure your digital world.</p>
      </footer>
    </div>
  );
}

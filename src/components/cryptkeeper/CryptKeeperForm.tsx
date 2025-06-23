
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
import { aiKeyHardening, type AIKeyHardeningOutput } from '@/ai/flows/ai-key-hardening';
import { UploadCloud, Lock, Unlock, Wand2, Copy, Loader2, FileText, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import CloudStorage from './CloudStorage';

export default function CryptKeeperForm() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<AIKeyHardeningOutput | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operationSuccess, setOperationSuccess] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [encryptedBlob, setEncryptedBlob] = useState<Blob | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  
  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile) {
        setFile(selectedFile);
        setEncryptedBlob(null);
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

  const resetStatus = () => {
    setOperationError(null);
    setOperationSuccess(null);
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
      const pako = (await import('pako')).default;
      const arrayBuffer = await file.arrayBuffer();
      let resultBuffer: ArrayBuffer | null = null;
      let outputFileName: string = '';

      if (operationType === 'encrypt') {
        resultBuffer = await encryptData(arrayBuffer, password, pako);
        outputFileName = `${file.name}.cptk`;
        setOperationSuccess(`File "${file.name}" encrypted and compressed successfully as "${outputFileName}".`);
      } else { // operationType === 'decrypt'
        resultBuffer = await decryptData(arrayBuffer, password, pako);
        if (file.name.toLowerCase().endsWith('.cptk')) {
          outputFileName = file.name.slice(0, -5);
        } else {
          outputFileName = `${file.name}.decrypted`;
        }
        setOperationSuccess(`File "${file.name}" decrypted and decompressed successfully as "${outputFileName}".`);
      }
      
      if (resultBuffer) {
        const blob = new Blob([resultBuffer]);
        if (operationType === 'encrypt') {
            setEncryptedBlob(blob);
        }
        
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

  const handleAiHardenPassword = async () => {
    if (!password) {
      toast({ title: "Password Required", description: "Please enter a base password to harden.", variant: "destructive" });
      return;
    }
    setIsAiLoading(true);
    setAiSuggestion(null);
    resetStatus();
    try {
      const result = await aiKeyHardening({ password });
      setAiSuggestion(result);
      toast({ title: "AI Suggestion Ready", description: "AI has generated a key suggestion." });
    } catch (err: any) {
      console.error("AI Key Hardening error:", err);
      const errorMessage = err.message || "An error occurred while fetching AI suggestions.";
      setOperationError(errorMessage);
      toast({ title: "AI Hardening Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  const useAiKey = () => {
    if (aiSuggestion?.enhancedKey) {
      setPassword(aiSuggestion.enhancedKey);
      toast({ title: "Password Updated", description: "AI suggested key has been applied to the password field." });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: "Copied!", description: "Key copied to clipboard." }))
      .catch(() => toast({ title: "Copy Failed", description: "Could not copy key.", variant: "destructive" }));
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
        <div className="flex items-center justify-center space-x-3">
          <ShieldCheck size={48} className="text-primary" suppressHydrationWarning />
          <h1 className="text-4xl font-bold tracking-tight">CryptKeeper</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Securely encrypt and decrypt your files with client-side power.
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
          <AlertDescription>{operationSuccess}</AlertDescription>
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
              <div className="mt-2 text-sm text-muted-foreground flex items-center p-2 rounded-md bg-secondary">
                <FileText className="w-4 h-4 mr-2 shrink-0" suppressHydrationWarning /> Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
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
            className="w-full sm:w-auto text-base py-3 px-6"
            size="lg"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" suppressHydrationWarning /> : <Lock className="mr-2 h-5 w-5" suppressHydrationWarning />}
            Encrypt File
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOperation('decrypt')}
            disabled={isLoading || !file || !password}
            className="w-full sm:w-auto text-base py-3 px-6"
            size="lg"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" suppressHydrationWarning /> : <Unlock className="mr-2 h-5 w-5" suppressHydrationWarning />}
            Decrypt File
          </Button>
        </CardFooter>
      </Card>
      
      <CloudStorage onFileSelect={handleCloudFileSelect} getEncryptedBlob={getEncryptedBlob} file={file} />

      <Card className="shadow-2xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl">AI Key Hardening</CardTitle>
          <CardDescription>Strengthen your password with an AI-generated memorable key.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="secondary"
            onClick={handleAiHardenPassword}
            disabled={isAiLoading || !password}
            className="w-full text-base py-3 px-6"
            size="lg"
          >
            {isAiLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" suppressHydrationWarning /> : <Wand2 className="mr-2 h-5 w-5" suppressHydrationWarning />}
            Suggest Strong Key
          </Button>
          {aiSuggestion && (
            <div className="mt-4 space-y-4 p-4 border rounded-md bg-gradient-to-tr from-primary/10 via-card to-accent/10 animate-in fade-in-50">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">AI Suggested Key:</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="font-mono text-sm p-2 bg-background rounded-md flex-grow break-all">{aiSuggestion.enhancedKey}</p>

                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(aiSuggestion.enhancedKey)} suppressHydrationWarning>
                    <Copy className="h-4 w-4" suppressHydrationWarning />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Strength Report:</Label>
                <div className="text-sm mt-1 p-3 bg-background rounded-md whitespace-pre-wrap prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: aiSuggestion.strengthReport.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>').replace(/\n/g, '<br />') }} />
              </div>
              <Button onClick={useAiKey} className="w-full mt-2" size="sm" variant="outline">Use This Key</Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <footer className="text-center text-sm text-muted-foreground mt-12">
        <p>&copy; {currentYear} CryptKeeper. Secure your digital world.</p>
      </footer>
    </div>
  );
}

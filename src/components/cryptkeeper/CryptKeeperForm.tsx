
// src/components/cryptkeeper/CryptKeeperForm.tsx
"use client";

import React, { useState, useRef, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { encryptData, decryptData } from '@/lib/crypto';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import { aiKeyHardening, type AIKeyHardeningOutput } from '@/ai/flows/ai-key-hardening';
import { UploadCloud, DownloadCloud, Lock, Unlock, Wand2, Copy, Loader2, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LogoIcon } from '../icons/LogoIcon';

export default function CryptKeeperForm() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<AIKeyHardeningOutput | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operationSuccess, setOperationSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setOperationError(null);
      setOperationSuccess(null);
    }
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
      const arrayBuffer = await file.arrayBuffer();
      let resultBuffer: ArrayBuffer | null = null;
      let outputFileName: string = '';

      if (operationType === 'encrypt') {
        resultBuffer = await encryptData(arrayBuffer, password);
        outputFileName = `${file.name}.cptk`;
        setOperationSuccess(`File "${file.name}" encrypted successfully as "${outputFileName}".`);
      } else { // operationType === 'decrypt'
        resultBuffer = await decryptData(arrayBuffer, password);
        if (file.name.toLowerCase().endsWith('.cptk')) {
          outputFileName = file.name.slice(0, -5); // Remove .cptk to restore original name
          if (outputFileName === "") { // Edge case: file was just ".cptk"
            outputFileName = "decrypted_file"; 
          }
        } else {
          // Fallback if a non-.cptk file is somehow attempted to be decrypted
          // This case is unlikely if users only select .cptk files for decryption
          outputFileName = `${file.name}.decrypted_original_unknown`;
        }
        setOperationSuccess(`File "${file.name}" decrypted successfully. The downloaded file is named "${outputFileName}".`);
      }

      if (resultBuffer) {
        const blob = new Blob([resultBuffer]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = outputFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Success", description: `File ${operationType === 'encrypt' ? 'encrypted' : 'decrypted'} and download started.` });
      } else {
        throw new Error(`File ${operationType} failed.`);
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

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl space-y-8">
      <header className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-3">
          <LogoIcon size={48} className="text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">CryptKeeper</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Securely encrypt and decrypt your files with ease.
        </p>
      </header>

      {operationError && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Operation Failed</AlertTitle>
          <AlertDescription>{operationError}</AlertDescription>
        </Alert>
      )}
      {operationSuccess && (
         <Alert variant="default" className="animate-in fade-in-50 bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>{operationSuccess}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">File Operation</CardTitle>
          <CardDescription>Select a file and enter your password to encrypt or decrypt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file-upload" className="text-base">Select File</Label>
            <Input 
              id="file-upload" 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {file && (
              <div className="mt-2 text-sm text-muted-foreground flex items-center">
                <FileText className="w-4 h-4 mr-2 shrink-0" /> Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-base">Password</Label>
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
            disabled={isLoading || !file} 
            className="w-full sm:w-auto text-base py-3 px-6"
            size="lg"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
            Encrypt File
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleOperation('decrypt')} 
            disabled={isLoading || !file} 
            className="w-full sm:w-auto text-base py-3 px-6"
            size="lg"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Unlock className="mr-2 h-5 w-5" />}
            Decrypt File
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-xl">
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
            {isAiLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
            Suggest Strong Key
          </Button>
          {aiSuggestion && (
            <div className="mt-4 space-y-4 p-4 border rounded-md bg-secondary/30 animate-in fade-in-50">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">AI Suggested Key:</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="font-mono text-sm p-2 bg-background rounded-md flex-grow break-all">{aiSuggestion.enhancedKey}</p>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(aiSuggestion.enhancedKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Strength Report:</Label>
                <p className="text-sm mt-1 p-2 bg-background rounded-md whitespace-pre-wrap">{aiSuggestion.strengthReport}</p>
              </div>
              <Button onClick={useAiKey} className="w-full mt-2" size="sm">Use This Key</Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <footer className="text-center text-sm text-muted-foreground mt-12">
        <p>&copy; {new Date().getFullYear()} CryptKeeper. Secure your digital world.</p>
      </footer>
    </div>
  );
}

// src/components/cryptkeeper/FileIntegrityChecker.tsx
"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { UploadCloud, FileText, X, Loader2, ShieldCheck, ShieldAlert, Scale } from 'lucide-react';

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

export default function FileIntegrityChecker() {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [checkFile, setCheckFile] = useState<File | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonResult, setComparisonResult] = useState<'match' | 'mismatch' | 'error' | null>(null);
    const [resultMessage, setResultMessage] = useState<string | null>(null);
    
    const [isDraggingOriginal, setIsDraggingOriginal] = useState(false);
    const [isDraggingCheck, setIsDraggingCheck] = useState(false);
    
    const originalFileInputRef = useRef<HTMLInputElement>(null);
    const checkFileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const reset = () => {
        setComparisonResult(null);
        setResultMessage(null);
    }
    
    const handleOriginalFileSelect = (selectedFile: File | null) => {
        setOriginalFile(selectedFile);
        reset();
    };

    const handleCheckFileSelect = (selectedFile: File | null) => {
        setCheckFile(selectedFile);
        reset();
    };
    
    const handleRemoveOriginalFile = () => {
        setOriginalFile(null);
        if (originalFileInputRef.current) originalFileInputRef.current.value = "";
        reset();
    };
    
    const handleRemoveCheckFile = () => {
        setCheckFile(null);
        if (checkFileInputRef.current) checkFileInputRef.current.value = "";
        reset();
    };

    const handleCompare = async () => {
        if (!originalFile || !checkFile) {
            toast({ title: "Files needed", description: "Please select both an original file and a file to check.", variant: "destructive" });
            return;
        }

        setIsComparing(true);
        reset();

        try {
            const originalBuffer = await originalFile.arrayBuffer();
            const checkBuffer = await checkFile.arrayBuffer();

            if (compareArrayBuffers(originalBuffer, checkBuffer)) {
                setComparisonResult('match');
                setResultMessage(`Files are identical! Both files are ${originalFile.size.toLocaleString()} bytes.`);
            } else {
                setComparisonResult('mismatch');
                const sizeDifference = originalFile.size - checkFile.size;
                setResultMessage(`Files do NOT match. Original is ${originalFile.size.toLocaleString()} bytes, while the file to check is ${checkFile.size.toLocaleString()} bytes. Difference: ${sizeDifference.toLocaleString()} bytes.`);
            }
        } catch (err: any) {
            setComparisonResult('error');
            setResultMessage(err.message || 'An unknown error occurred while reading the files.');
        } finally {
            setIsComparing(false);
        }
    };
    
    return (
        <Card className="shadow-2xl shadow-primary/10">
            <CardHeader>
                <CardTitle className="text-2xl">Manual File Integrity Check</CardTitle>
                <CardDescription>Verify data integrity by comparing the original file with the decrypted one.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {comparisonResult && resultMessage && (
                    <Alert variant={comparisonResult === 'match' ? 'default' : 'destructive'} className={cn(comparisonResult === 'match' && "border-accent/50 text-accent dark:text-accent-foreground")}>
                        {comparisonResult === 'match' ? <ShieldCheck className="h-4 w-4 text-accent" suppressHydrationWarning /> : <ShieldAlert className="h-4 w-4" suppressHydrationWarning />}
                        <AlertTitle>{comparisonResult === 'match' ? 'Success: Files Match!' : (comparisonResult === 'mismatch' ? 'Warning: Files Do Not Match!' : 'Error')}</AlertTitle>
                        <AlertDescription>{resultMessage}</AlertDescription>
                    </Alert>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Original File Input */}
                    <div className="space-y-2">
                        <Label>Original File</Label>
                         <div
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnter={(e) => { e.preventDefault(); setIsDraggingOriginal(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDraggingOriginal(false); }}
                            onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDraggingOriginal(false); handleOriginalFileSelect(e.dataTransfer.files?.[0] || null); }}
                            onClick={() => originalFileInputRef.current?.click()}
                            className={cn("relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200", isDraggingOriginal ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-secondary/50")}
                        >
                             <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                <UploadCloud className={cn("w-8 h-8 mb-2", isDraggingOriginal ? "text-primary" : "text-muted-foreground")} suppressHydrationWarning/>
                                <p className="text-xs text-muted-foreground"><span className="font-semibold">Click or drop file</span></p>
                            </div>
                            <Input id="original-file-upload" type="file" ref={originalFileInputRef} onChange={(e: ChangeEvent<HTMLInputElement>) => handleOriginalFileSelect(e.target.files?.[0] || null)} className="hidden" />
                        </div>
                        {originalFile && (
                            <div className="mt-2 text-sm text-muted-foreground flex items-center justify-between p-2 pl-3 rounded-md bg-secondary border">
                                <div className="flex items-center min-w-0">
                                    <FileText className="w-4 h-4 mr-2 shrink-0" suppressHydrationWarning />
                                    <span className="truncate">{originalFile.name} ({(originalFile.size / 1024).toFixed(2)} KB)</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleRemoveOriginalFile} className="h-7 w-7 shrink-0" suppressHydrationWarning>
                                    <X className="h-4 w-4" suppressHydrationWarning />
                                    <span className="sr-only">Remove file</span>
                                </Button>
                            </div>
                        )}
                    </div>
                    {/* File to Check Input */}
                    <div className="space-y-2">
                        <Label>File to Check</Label>
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnter={(e) => { e.preventDefault(); setIsDraggingCheck(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDraggingCheck(false); }}
                            onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDraggingCheck(false); handleCheckFileSelect(e.dataTransfer.files?.[0] || null); }}
                            onClick={() => checkFileInputRef.current?.click()}
                            className={cn("relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200", isDraggingCheck ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-secondary/50")}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                <UploadCloud className={cn("w-8 h-8 mb-2", isDraggingCheck ? "text-primary" : "text-muted-foreground")} suppressHydrationWarning/>
                                <p className="text-xs text-muted-foreground"><span className="font-semibold">Click or drop file</span></p>
                            </div>
                            <Input id="check-file-upload" type="file" ref={checkFileInputRef} onChange={(e: ChangeEvent<HTMLInputElement>) => handleCheckFileSelect(e.target.files?.[0] || null)} className="hidden" />
                        </div>
                        {checkFile && (
                            <div className="mt-2 text-sm text-muted-foreground flex items-center justify-between p-2 pl-3 rounded-md bg-secondary border">
                                <div className="flex items-center min-w-0">
                                    <FileText className="w-4 h-4 mr-2 shrink-0" suppressHydrationWarning />
                                    <span className="truncate">{checkFile.name} ({(checkFile.size / 1024).toFixed(2)} KB)</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleRemoveCheckFile} className="h-7 w-7 shrink-0" suppressHydrationWarning>
                                    <X className="h-4 w-4" suppressHydrationWarning />
                                    <span className="sr-only">Remove file</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <Button
                    onClick={handleCompare}
                    disabled={isComparing || !originalFile || !checkFile}
                    className="w-full text-base py-3 px-6"
                    size="lg"
                >
                    {isComparing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" suppressHydrationWarning /> : <Scale className="mr-2 h-5 w-5" suppressHydrationWarning />}
                    Compare Files
                </Button>
            </CardContent>
        </Card>
    );
}

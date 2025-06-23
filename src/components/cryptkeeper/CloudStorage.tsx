
"use client";

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { CloudUpload, CloudDownload, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { auth, storage } from '@/lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';

interface CloudStorageProps {
    file: File | null;
    getEncryptedBlob: () => Blob | null;
    onFileSelect: (file: File) => void;
}

export default function CloudStorage({ file, getEncryptedBlob, onFileSelect }: CloudStorageProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async () => {
        if (!user || !storage) {
            toast({ title: "Authentication or Configuration Error", description: "Please sign in to upload files. Cloud storage may not be configured.", variant: "destructive" });
            return;
        }

        if (!file) {
            toast({ title: "No file selected", description: "Please select a local file first.", variant: "destructive" });
            return;
        }
        
        const encryptedBlob = getEncryptedBlob();
        if (!encryptedBlob) {
            // The getEncryptedBlob function already shows a toast
            return;
        }

        setIsUploading(true);

        try {
            const storageRef = ref(storage, `users/${user!.uid}/files/${file.name}.cptk`);
            await uploadBytes(storageRef, encryptedBlob);
            toast({
                title: "Upload Successful",
                description: `${file.name}.cptk has been uploaded to your cloud storage.`,
            });
        } catch (error) {
            console.error("Error uploading file:", error);
            toast({
                title: "Upload Failed",
                description: "There was a problem uploading your file. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleBrowse = () => {
        toast({
            title: "Coming Soon!",
            description: "Browsing and decrypting cloud files is under construction.",
            variant: "default"
        });
    };

    // Do not render the cloud storage component if Firebase is not configured or user is not logged in.
    if (!user || !auth || !storage) {
        return null;
    }

    return (
        <Card className="shadow-2xl shadow-primary/10">
            <CardHeader>
                <CardTitle className="text-2xl">Cloud Storage</CardTitle>
                <CardDescription>Upload encrypted files or decrypt files from your cloud storage.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row justify-between gap-4">
                <Button onClick={handleUpload} disabled={isUploading || !file} className="w-full sm:w-auto text-base py-3 px-6" size="lg">
                    {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CloudUpload className="mr-2 h-5 w-5" />}
                    Upload to Cloud
                </Button>
                <Button onClick={handleBrowse} variant="outline" className="w-full sm:w-auto text-base py-3 px-6" size="lg">
                    <CloudDownload className="mr-2 h-5 w-5" />
                    Browse Cloud Files
                </Button>
            </CardContent>
        </Card>
    );
}

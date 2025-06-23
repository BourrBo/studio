
"use client";

import React from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

export default function AuthButtons() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async () => {
    if (!auth) {
      toast({ title: "Configuration Error", description: "Firebase authentication is not configured.", variant: "destructive" });
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Signed In", description: "You have successfully signed in." });
    } catch (error) {
      console.error("Error signing in with Google", error);
      toast({ title: "Sign-in Failed", description: "There was an error signing in.", variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    if (!auth) {
      toast({ title: "Configuration Error", description: "Firebase authentication is not configured.", variant: "destructive" });
      return;
    }
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been signed out." });
    } catch (error) {
      console.error("Error signing out", error);
       toast({ title: "Sign-out Failed", description: "There was an error signing out.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
        <Button variant="outline" size="icon" disabled>
            <Loader2 className="h-4 w-4 animate-spin" suppressHydrationWarning />
        </Button>
    )
  }
  
  // If auth is not configured, don't show any auth-related buttons.
  if (!auth) {
    return null;
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
              <AvatarFallback>
                <UserIcon suppressHydrationWarning />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" suppressHydrationWarning />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={handleSignIn} variant="outline">
      <LogIn className="mr-2 h-4 w-4" suppressHydrationWarning />
      Sign in
    </Button>
  );
}

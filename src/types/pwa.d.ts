interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    prompt(): Promise<void>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
}

interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
}
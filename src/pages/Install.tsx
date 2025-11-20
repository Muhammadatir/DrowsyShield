import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, CheckCircle, Smartphone, Wifi, Bell, Shield } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Install = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      toast({
        title: 'App Installed',
        description: 'DrowsyGuard has been installed on your device!',
      });
    } else {
      toast({
        title: 'Installation Cancelled',
        description: 'You can install the app later from this page.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Install DrowsyGuard</h1>
          <p className="text-muted-foreground">
            Get the full app experience on your device
          </p>
        </div>

        {isInstalled ? (
          <Card className="border-accent">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-accent" />
                <CardTitle>App Installed</CardTitle>
              </div>
              <CardDescription>
                DrowsyGuard is already installed on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                Go to Home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Why Install?</CardTitle>
                <CardDescription>
                  Installing DrowsyGuard provides these benefits:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Quick Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Launch directly from your home screen like a native app
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Wifi className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Offline Functionality</h3>
                    <p className="text-sm text-muted-foreground">
                      Core features work even without internet connection
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Push Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive instant alerts for drowsiness detection
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Better Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      Faster loading and smoother experience
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isInstallable ? (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle>Ready to Install</CardTitle>
                  <CardDescription>
                    Click the button below to install DrowsyGuard on your device
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleInstall} className="w-full" size="lg">
                    <Download className="mr-2 h-5 w-5" />
                    Install Now
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Installation Not Available</CardTitle>
                  <CardDescription>
                    Your browser doesn't support app installation, or you've already dismissed the prompt
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>On mobile browsers:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>iOS Safari: Tap Share → Add to Home Screen</li>
                      <li>Android Chrome: Menu → Add to Home Screen</li>
                    </ul>
                  </div>
                  <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                    Continue to App
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Install;

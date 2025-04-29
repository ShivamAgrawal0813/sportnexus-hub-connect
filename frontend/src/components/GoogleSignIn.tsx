import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { AUTH_ENDPOINTS } from '@/config/api.config';

const GoogleSignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUser, setToken, setIsAuthenticated } = useAuth();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      const response = await fetch(AUTH_ENDPOINTS.GOOGLE_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update auth context with user data and token
        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);
        console.log('User set:', data.user);
        console.log('Token set:', data.token);

        toast({
          title: "Success",
          description: "Successfully signed in with Google",
        });

        // Redirect to venues page
        console.log('Navigating to /venues');
        navigate('/venues');
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  const handleError = () => {
    toast({
      title: "Error",
      description: "Google sign in failed",
      variant: "destructive",
    });
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        theme="filled_blue"
        shape="pill"
        size="large"
        text="continue_with"
        locale="en"
      />
    </div>
  );
};

export default GoogleSignIn; 
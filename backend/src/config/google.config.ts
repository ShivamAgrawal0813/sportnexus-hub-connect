import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (token: string) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Invalid token payload');
    }
    
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      // You can add more fields as needed
    };
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw error;
  }
}; 
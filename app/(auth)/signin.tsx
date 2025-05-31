import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';

export default function SignInScreen() {
  const { signIn, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    if (!isLoaded) return;
    try {
      await signIn.create({
        identifier: email,
        password,
      });
      // After sign-in, Clerk manages session automatically
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.errors?.[0]?.message || err.message);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Sign In" onPress={handleSignIn} />
    </View>
  );
}

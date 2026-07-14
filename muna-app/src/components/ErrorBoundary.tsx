import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import * as Sentry from '@sentry/react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>Something went wrong</Text>
          <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32 }}>
            We encountered an unexpected error. Our team has been notified.
          </Text>
          
          <TouchableOpacity 
            onPress={this.handleReset}
            style={{ backgroundColor: '#0f172a', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Try Again</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

# ASWebAuthenticationSession Integration Demo

This demo shows how to use ASWebAuthenticationSession to pass data between a React Native app and a web interface, specifically for importing account data using the Base Account SDK.

## Authentication Flow

### 1. Initiating Auth from Native App

The native app starts the authentication session when the user taps "Open Web Session":

```typescript
// UserScreen.tsx
const openWebSession = useCallback(async () => {
  const webUrl = `http://localhost:5173?address=${encodeURIComponent(account.address)}`;
  
  const result = await WebBrowser.openAuthSessionAsync(webUrl, 'myapp://');
  
  if (result.type === 'success' && result.url) {
    // Parse returned data and handle it
    const parsed = Linking.parse(result.url);
    const decodedData = decodeURIComponent(parsed.queryParams.data);
    const accountData = JSON.parse(decodedData);
    onAccountDataReceived(accountData);
  }
}, [account?.address]);
```

**What happens:**
- Opens web browser session to `localhost:5173` with wallet address as URL parameter
- Waits for redirect back to `myapp://` scheme
- Parses and handles returned account data

### 2. Frontend Processing

The web app receives the wallet address and connects to Base Account SDK:

```typescript
// App.tsx
const handleReturnAccountData = async () => {
  // Connect to Base Account SDK
  const response = await provider.request({
    method: "wallet_connect",
    params: [{
      capabilities: {
        signInWithEthereum: {
          nonce: "123",
        },
      },
    }],
  });

  // Encode response data for return to native app
  const encodedData = encodeURIComponent(
    JSON.stringify(response.accounts[0])
  );
  const redirectUrl = `myapp://accounts?data=${encodedData}`;

  // Redirect back to native app
  const anchor = document.createElement('a');
  anchor.href = redirectUrl;
  anchor.click();
};
```

**What happens:**
- Receives wallet address from URL parameters
- Makes `wallet_connect` request to Base Account SDK
- Encodes account data as JSON
- Redirects back to native app with encoded data

### 3. Data Return & Native Display

The native app receives the data and displays it:

```typescript
// index.tsx - Data Reception
const handleAccountDataReceived = useCallback((data: AccountData) => {
  setAccountData(data);
}, []);

// Data Display
if (accountData) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          Response Received
        </Text>
        
        <ScrollView style={{ backgroundColor: '#f5f5f5', flex: 1 }}>
          <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {JSON.stringify(accountData, null, 2)}
          </Text>
        </ScrollView>
        
        <Text onPress={() => setAccountData(null)}>
          Clear Data & Return to App
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

**What happens:**
- Receives account data via callback from auth session result
- Displays raw JSON response in scrollable view
- Provides option to clear data and return to main app

## Data Flow Summary

```
Native App → Web App → Base SDK → Web App → Native App
     ↓           ↓          ↓         ↓         ↓
  Address    Connect   Get Data   Encode    Display
 Parameter   to SDK   & Accounts  & Return   JSON
```

1. **Native sends**: Wallet address via URL parameter
2. **Web receives**: Address, connects to Base Account SDK
3. **Web returns**: Account data via custom URL scheme redirect
4. **Native displays**: Raw JSON response in scrollable interface 
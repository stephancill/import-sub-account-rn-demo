import { SafeAreaView, Text, View, ScrollView } from "react-native";
import Constants from "expo-constants";
import LoginScreen from "@/components/LoginScreen";
import { usePrivy } from "@privy-io/expo";
import { UserScreen } from "@/components/UserScreen";
import * as Linking from "expo-linking";
import { useEffect, useState, useCallback } from "react";

interface SubAccount {
  address: string;
  factory: string;
  factoryData: string;
}

interface Account {
  address: string;
  capabilities: {
    subAccounts: SubAccount[];
  };
}

interface AccountData {
  accounts: Account[];
}

export default function Index() {
  const { user } = usePrivy();
  const [accountData, setAccountData] = useState<AccountData | null>(null);

  const handleAccountDataReceived = useCallback((data: AccountData) => {
    setAccountData(data);
  }, []);

  useEffect(() => {
    // Handle URL linking when the app is opened with a URL
    const handleUrl = (url: string) => {
      const parsed = Linking.parse(url);

      if (parsed.hostname === "accounts" && parsed.queryParams?.data) {
        try {
          const decodedData = decodeURIComponent(
            parsed.queryParams.data as string
          );
          const parsedData = JSON.parse(decodedData) as AccountData;
          setAccountData(parsedData);
          console.log("Received account data:", parsedData);
        } catch (error) {
          console.error("Error parsing account data:", error);
        }
      }
    };

    // Listen for URL events when the app is already open
    const subscription = Linking.addEventListener("url", (event) => {
      handleUrl(event.url);
    });

    // Check if the app was opened with a URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  if ((Constants.expoConfig?.extra?.privyAppId as string).length !== 25) {
    return (
      <SafeAreaView>
        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text>You have not set a valid `privyAppId` in app.json</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (
    !(Constants.expoConfig?.extra?.privyClientId as string).startsWith(
      "client-"
    )
  ) {
    return (
      <SafeAreaView>
        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text>You have not set a valid `privyClientId` in app.json</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If we have account data, show it
  if (accountData) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <View style={{ padding: 20 }}>
            <Text
              style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}
            >
              Response Received
            </Text>
          </View>

          <ScrollView
            style={{
              backgroundColor: "#f5f5f5",
              margin: 20,
              marginTop: 0,
              padding: 15,
              borderRadius: 8,
              flex: 1,
            }}
            showsVerticalScrollIndicator={true}
          >
            <Text style={{ fontFamily: "monospace", fontSize: 12 }}>
              {JSON.stringify(accountData, null, 2)}
            </Text>
          </ScrollView>

          <View style={{ padding: 20, paddingTop: 10 }}>
            <Text
              style={{
                color: "blue",
                textDecorationLine: "underline",
                textAlign: "center",
                fontSize: 16,
                padding: 10,
              }}
              onPress={() => setAccountData(null)}
            >
              Clear Data & Return to App
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return !user ? (
    <LoginScreen />
  ) : (
    <UserScreen onAccountDataReceived={handleAccountDataReceived} />
  );
}

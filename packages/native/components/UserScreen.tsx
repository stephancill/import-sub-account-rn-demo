import React, { useState, useCallback } from "react";
import { Text, TextInput, View, Button, ScrollView } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

import {
  usePrivy,
  useEmbeddedEthereumWallet,
  getUserEmbeddedEthereumWallet,
  PrivyEmbeddedWalletProvider,
  useLinkWithOAuth,
} from "@privy-io/expo";
import Constants from "expo-constants";
import { useLinkWithPasskey } from "@privy-io/expo/passkey";
import { PrivyUser } from "@privy-io/public-api";

const toMainIdentifier = (x: PrivyUser["linked_accounts"][number]) => {
  if (x.type === "phone") {
    return x.phoneNumber;
  }
  if (x.type === "email" || x.type === "wallet") {
    return x.address;
  }

  if (x.type === "twitter_oauth" || x.type === "tiktok_oauth") {
    return x.username;
  }

  if (x.type === "custom_auth") {
    return x.custom_user_id;
  }

  return x.type;
};

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

interface UserScreenProps {
  onAccountDataReceived?: (data: AccountData) => void;
}

export const UserScreen = ({ onAccountDataReceived }: UserScreenProps = {}) => {
  const [chainId, setChainId] = useState("1");
  const [signedMessages, setSignedMessages] = useState<string[]>([]);

  const { logout, user } = usePrivy();
  const { linkWithPasskey } = useLinkWithPasskey();
  const oauth = useLinkWithOAuth();
  const { wallets, create } = useEmbeddedEthereumWallet();
  const account = getUserEmbeddedEthereumWallet(user);

  const openWebSession = useCallback(async () => {
    if (!account?.address) {
      alert("No wallet address available");
      return;
    }

    const webUrl = `http://localhost:5173?address=${encodeURIComponent(
      account.address
    )}`;

    try {
      const result = await WebBrowser.openAuthSessionAsync(webUrl, "myapp://");
      console.log("Auth session result:", result);

      // Handle the result directly if it contains our data
      if (result.type === "success" && result.url) {
        const parsed = Linking.parse(result.url);

        if (parsed.hostname === "accounts" && parsed.queryParams?.data) {
          try {
            const decodedData = decodeURIComponent(
              parsed.queryParams.data as string
            );
            const parsedData = JSON.parse(decodedData) as AccountData;
            console.log("Parsed account data:", parsedData);

            // Call the callback if provided
            if (onAccountDataReceived) {
              onAccountDataReceived(parsedData);
            }
          } catch (error) {
            console.error("Error parsing account data:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error opening auth session:", error);
      alert("Error opening authentication session");
    }
  }, [account?.address, onAccountDataReceived]);

  const signMessage = useCallback(
    async (provider: PrivyEmbeddedWalletProvider) => {
      try {
        const message = await provider.request({
          method: "personal_sign",
          params: [`0x0${Date.now()}`, account?.address],
        });
        if (message) {
          setSignedMessages((prev) => prev.concat(message));
        }
      } catch (e) {
        console.error(e);
      }
    },
    [account?.address]
  );

  const switchChain = useCallback(
    async (provider: PrivyEmbeddedWalletProvider, id: string) => {
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: id }],
        });
        alert(`Chain switched to ${id} successfully`);
      } catch (e) {
        console.error(e);
      }
    },
    [account?.address]
  );

  if (!user) {
    return null;
  }

  return (
    <View>
      <View style={{ margin: 10 }}>
        <Button
          title="Open Web Session"
          onPress={openWebSession}
          disabled={!account?.address}
        />
      </View>

      <ScrollView style={{ borderColor: "rgba(0,0,0,0.1)", borderWidth: 1 }}>
        <View
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <View>
            <Text style={{ fontWeight: "bold" }}>User ID</Text>
            <Text>{user.id}</Text>
          </View>

          <View>
            <Text style={{ fontWeight: "bold" }}>Linked accounts</Text>
            {user?.linked_accounts.length ? (
              <View style={{ display: "flex", flexDirection: "column" }}>
                {user?.linked_accounts?.map((m, index) => (
                  <Text
                    key={`linked-account-${m.type}-${m.verified_at}-${index}`}
                    style={{
                      color: "rgba(0,0,0,0.5)",
                      fontSize: 12,
                      fontStyle: "italic",
                    }}
                  >
                    {m.type}: {toMainIdentifier(m)}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>

          <View>
            {account?.address && (
              <>
                <Text style={{ fontWeight: "bold" }}>Embedded Wallet</Text>
                <Text>{account?.address}</Text>
              </>
            )}

            <Button title="Create Wallet" onPress={() => create()} />

            <>
              <Text>Chain ID to set to:</Text>
              <TextInput
                value={chainId}
                onChangeText={setChainId}
                placeholder="Chain Id"
              />
              <Button
                title="Switch Chain"
                onPress={async () =>
                  switchChain(await wallets[0].getProvider(), chainId)
                }
              />
            </>
          </View>

          <View style={{ display: "flex", flexDirection: "column" }}>
            <Button
              title="Sign Message"
              onPress={async () => signMessage(await wallets[0].getProvider())}
            />

            <Text>Messages signed:</Text>
            {signedMessages.map((m) => (
              <React.Fragment key={m}>
                <Text
                  style={{
                    color: "rgba(0,0,0,0.5)",
                    fontSize: 12,
                    fontStyle: "italic",
                  }}
                >
                  {m}
                </Text>
                <View
                  style={{
                    marginVertical: 5,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(0,0,0,0.2)",
                  }}
                />
              </React.Fragment>
            ))}
          </View>
          <Button title="Logout" onPress={logout} />
        </View>
      </ScrollView>
    </View>
  );
};

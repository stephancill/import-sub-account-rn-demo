import { useState, useEffect } from "react";
import "./App.css";
import {
  createBaseAccountSDK,
  type ProviderInterface,
} from "@base-org/account";

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ProviderInterface | null>(null);
  const [response, setResponse] = useState<any | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Parse address from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const addressParam = urlParams.get("address");

    const provider = createBaseAccountSDK({}).getProvider();

    setProvider(provider);

    provider.disconnect();

    if (addressParam) {
      setAddress(addressParam);
    }
  }, []);

  const handleReturnAccountData = async () => {
    if (!provider) {
      return;
    }

    setIsConnecting(true);

    try {
      const response = await provider.request({
        method: "wallet_connect",
        params: [
          {
            capabilities: {
              // addSubAccount: {
              //   account: {
              //     type: "deployed",
              //     address: address,
              //     chainId: 8453,
              //   },
              // },
              signInWithEthereum: {
                nonce: "123",
              },
            },
          },
        ],
      });

      setResponse(response);

      // Encode the account data as a URL parameter and redirect back to the native app
      const encodedData = encodeURIComponent(
        JSON.stringify((response as any)["accounts"][0])
      );
      const redirectUrl = `myapp://accounts?data=${encodedData}`;

      // Small delay to ensure state updates are rendered
      setTimeout(() => {
        // Create an anchor element and trigger click for better compatibility
        const anchor = document.createElement("a");
        anchor.href = redirectUrl;
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      }, 500);
    } catch (error) {
      console.error("Connection error:", error);
      setIsConnecting(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      {address ? (
        <div>
          <h2>Sub account import</h2>
          <p
            style={{
              wordBreak: "break-all",
              backgroundColor: "#f0f0f0",
              padding: "10px",
              borderRadius: "5px",
              fontFamily: "monospace",
              margin: "20px 0",
            }}
          >
            {address}
          </p>

          {!isConnecting ? (
            <button
              onClick={handleReturnAccountData}
              style={{
                padding: "15px 30px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              Connect and import
            </button>
          ) : (
            <div>
              <button
                disabled
                style={{
                  padding: "15px 30px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "not-allowed",
                  fontSize: "16px",
                  fontWeight: "500",
                  marginBottom: "20px",
                }}
              >
                Connecting...
              </button>
              {response && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "15px",
                    backgroundColor: "#d4edda",
                    borderRadius: "8px",
                    border: "1px solid #c3e6cb",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontWeight: "bold",
                      color: "#155724",
                    }}
                  >
                    ✅ Connection successful! Redirecting to native app...
                  </p>
                  <p
                    style={{ margin: "0", fontSize: "14px", color: "#155724" }}
                  >
                    If the app doesn't redirect automatically, please return to
                    the native app manually.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2>Waiting for Connection</h2>
          <p>Use the native app to connect your wallet.</p>
        </div>
      )}

      {response && !isConnecting && (
        <pre>{JSON.stringify(response, null, 2)}</pre>
      )}
    </div>
  );
}

export default App;

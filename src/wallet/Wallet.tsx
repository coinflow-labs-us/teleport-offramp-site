import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {Connection, Keypair, PublicKey, Transaction} from "@solana/web3.js";
import {useLocalStorage} from "./useLocalStorage.ts";

export interface WalletContextProps {
  connected: boolean;
  publicKey: PublicKey | null;
  connection: Connection | null;
  sendTransaction: (transaction: Transaction) => Promise<string | null>;
  setPrivateKey: (privateKey: string) => void;
}

const WalletContext = createContext<WalletContextProps>({
  connected: false,
  publicKey: null,
  connection: null,
  sendTransaction: () => Promise.reject(new Error("")),
  setPrivateKey: () => {},
});

export function WalletContextProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [privateKey, setPrivateKey] = useLocalStorage("privateKey", "");

  useEffect(() => {
    if (!privateKey) return;

    try {
      setPublicKey(Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKey))).publicKey);
    } catch (e) {
      console.error(e);
    }
  }, [privateKey]);

  const connected = useMemo(() => !!publicKey, [publicKey]);

  const connection = useMemo(() => {
    return new Connection(import.meta.env.VITE_RPC_URL, "confirmed");
  }, []);

  const sendTransaction = useCallback(
    async (transaction: Transaction) => {
      if (!publicKey) return '';

      transaction.partialSign(Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKey))));
      return await connection.sendRawTransaction(transaction.serialize());
    },
    [connection, privateKey, publicKey],
  );

  return (
    <WalletContext.Provider
      value={{
        connected,
        publicKey,
        sendTransaction,
        connection,
        setPrivateKey
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useLocalWallet = () => useContext(WalletContext);

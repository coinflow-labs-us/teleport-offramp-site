import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

export interface WalletContextProps {
  connected: boolean;
  publicKey: PublicKey | null;
  connection: Connection | null;
  sendTransaction: (transaction: Transaction) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextProps>({
  connected: false,
  publicKey: null,
  connection: null,
  sendTransaction: () => Promise.reject(new Error("")),
});

export function WalletContextProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);

  useEffect(() => {
    if (wallet.publicKey) {
      setPublicKey(wallet.publicKey);
    }
  }, [wallet]);

  const connected = useMemo(() => !!publicKey, [publicKey]);

  const connection = useMemo(() => {
    return new Connection(import.meta.env.VITE_RPC_URL, "confirmed");
  }, []);

  const sendTransaction = useCallback(
    async (transaction: Transaction) => {
      if (!wallet.publicKey || !wallet.signTransaction) return null;

      const latestBlockHash = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = latestBlockHash.blockhash;
      await wallet.signTransaction(transaction);
      return await wallet.sendTransaction(transaction, connection);
    },
    [connection, wallet, wallet.signTransaction],
  );

  return (
    <WalletContext.Provider
      value={{
        connected,
        publicKey,
        sendTransaction,
        connection,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useLocalWallet = () => useContext(WalletContext);

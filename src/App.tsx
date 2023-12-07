import "./App.css";
import { WalletProvider } from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { useLocalWallet, WalletContextProvider } from "./wallet/Wallet.tsx";
import "@solana/wallet-adapter-react-ui/styles.css";
import sbcLogo from "./assets/sbc-logo.svg";
import logo from "./assets/logo.png";
import { useCallback, useEffect, useState } from "react";
import { CoinflowWithdraw } from "@coinflowlabs/react";
import { PublicKey } from "@solana/web3.js";

function App() {
  const [ready, setReady] = useState(false);

  return (
    <>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <WalletContextProvider>
            <div
              className={
                "w-screen max-w-screen flex flex-col items-center relative bg-black"
              }
            >
              <div
                className={
                  "w-screen sticky z-50 backdrop-filter backdrop-blur top-0 right-0 left-0  flex justify-center items-center bg-black/60"
                }
              >
                <div
                  className={
                    "flex justify-between p-4 items-center w-full lg:w-2/3 border-b-[0.5px] border-white/10"
                  }
                >
                  <img
                    src={logo}
                    className={"h-10 w-10 object-contain"}
                    alt={"logo"}
                  />
                  <WalletMultiButton />
                </div>
              </div>
              {ready ? null : <Intro setReady={setReady} />}
              <CoinflowComponent ready={ready} />
            </div>
          </WalletContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </>
  );
}

function Intro({ setReady }: { setReady: (r: boolean) => void }) {
  const { publicKey, connection } = useLocalWallet();

  const [balance, setBalance] = useState<number | null>(null);

  const getBalance = useCallback(async () => {
    if (!publicKey || !connection) {
      console.log("Null connection");
      return;
    }

    const ownedTokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        mint: new PublicKey("DBAzBUXaLj1qANCseUPZz4sp9F8d2sc78C4vKjhbTGMA"),
      },
    );

    const ownedTokenData = ownedTokenAccounts.value.map(
      (v) => v.account.data.parsed.info,
    );

    const noSbcAccountFound =
      !ownedTokenData ||
      ownedTokenData.length === 0 ||
      !ownedTokenData[0] ||
      !ownedTokenData[0].tokenAmount;

    if (noSbcAccountFound) setBalance(0);
    else setBalance(ownedTokenData[0].tokenAmount.uiAmount);
  }, [publicKey, connection]);

  useEffect(() => {
    setTimeout(() => {
      getBalance();
    }, 1000);
  }, [publicKey, connection]);

  return (
    <div
      className={"flex flex-col py-24 space-y-12 items-center relative w-full"}
    >
      <span className={"text-zinc-200 font-semibold text-base lg:text-lg"}>
        Withdraw your SBC to a bank or debit card
      </span>
      <div
        className={
          "rounded-3xl border-[1px] border-white/10 p-6 md:p-8 flex space-x-6 items-center w-11/12 md:w-96"
        }
      >
        <img
          src={sbcLogo}
          alt={"sbc"}
          className={"h-12 w-12 md:h-16 md:w-16"}
        />
        <BalanceLabel balance={balance} />
      </div>
      <button
        onClick={() => setReady(true)}
        className={
          "outline-none hover:bg-indigo-400 transition bg-indigo-500 font-bold text-base text-white rounded-full p-6 px-8 w-min decoration-0 whitespace-nowrap"
        }
      >
        Withdraw my SBC
      </button>

      {!publicKey ? (
        <div
          className={
            "absolute top-0 bottom-0 right-0 left-0 backdrop-blur-2xl bg-black/50 space-y-6 flex flex-col items-center justify-center"
          }
        >
          <img src={sbcLogo} alt={"sbc"} className={"h-12 w-12"} />
          <span className={"text-zinc-200 font-semibold text-base"}>
            Welcome. Connect your wallet to get started.
          </span>
          <div
            className={
              "flex items-center justify-center bg-white/5 rounded-full overflow-hidden hover:bg-white/10 transition backdrop-blur-2xl"
            }
          >
            <WalletMultiButton />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BalanceLabel({ balance }: { balance: number | null }) {
  if (!balance && balance !== 0) {
    return (
      <div className={"flex animate-pulse flex-1"}>
        <div className={"flex flex-col flex-1 space-y-2"}>
          <span className={"h-6 bg-zinc-800 w-20 rounded-md"} />
          <span className={"h-4 bg-zinc-900 w-32 rounded"} />
        </div>
        <span className={"h-9 bg-zinc-800 w-20 rounded-lg"} />
      </div>
    );
  }

  return (
    <div className={"flex items-center flex-1"}>
      <div className={"flex flex-col flex-1"}>
        <span className={"text-zinc-100 font-bold text-xl"}>SBC</span>
        <span className={"text-zinc-400 font-medium text-base"}>
          {balance.toFixed(4)} SBC
        </span>
      </div>
      <span className={"text-zinc-50 font-bold text-2xl"}>
        ${balance.toFixed(2)}
      </span>
    </div>
  );
}

function CoinflowComponent({ ready }: { ready: boolean }) {
  const wallet = useLocalWallet();

  const [height, setHeight] = useState<number>(1300);
  const [handleHeightChange, setHandleHeightChange] = useState<
    ((newHeight: string) => void) | undefined
  >(undefined);

  const handleHeight = useCallback((newHeight: string) => {
    setHeight(Number(newHeight));
  }, []);

  useEffect(() => {
    if (wallet.publicKey) {
      setHandleHeightChange(() => handleHeight);
    }
  }, [handleHeight, wallet]);

  if (!wallet.connection || !ready) return null;

  return (
    <div style={{ height: `${height}px` }} className={`w-full`}>
      <CoinflowWithdraw
        // @ts-ignore
        wallet={wallet}
        blockchain={"solana"}
        merchantId={"brale"}
        env={"prod"}
        loaderBackground={"#000000"}
        onSuccess={() => console.log("Withdraw Success")}
        connection={wallet.connection}
        handleHeightChange={handleHeightChange}
        tokens={["DBAzBUXaLj1qANCseUPZz4sp9F8d2sc78C4vKjhbTGMA"]}
        // tokens={["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"]}
      />
    </div>
  );
}

export default App;

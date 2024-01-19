import "./App.css";
import { useLocalWallet, WalletContextProvider } from "./wallet/Wallet.tsx";
import usdcLogo from "./assets/usdc-logo.png"
import logo from "./assets/matrica-logo.svg";
import { useCallback, useEffect, useState } from "react";
import { CoinflowWithdraw } from "@coinflowlabs/react";
import { PublicKey } from "@solana/web3.js";

function App() {
  const [ready, setReady] = useState(false);

  return (
    <>
      <WalletContextProvider>
        <div
          className={
            "w-screen max-w-screen flex flex-col items-center relative bg-slate-900"
          }
        >
          <div
            className={
              "w-screen sticky z-50 backdrop-filter backdrop-blur top-0 right-0 left-0 flex justify-center items-center bg-slate-900/60"
            }
          >
            <div
              className={
                "flex justify-between p-4 items-center w-full lg:w-2/3 border-b-[0.5px] border-white/10"
              }
            >
              <img
                src={logo}
                className={"h-5 object-contain"}
                alt={"logo"}
              />
            </div>
          </div>
          {ready ? null : <Intro setReady={setReady} />}
          <CoinflowComponent ready={ready} />
        </div>
      </WalletContextProvider>
    </>
  );
}

function Intro({ setReady }: { setReady: (r: boolean) => void }) {
  const { publicKey, connection, setPrivateKey } = useLocalWallet();

  const [balance, setBalance] = useState<number | null>(null);

  const getBalance = useCallback(async () => {
    if (!publicKey || !connection) {
      console.log("Null connection");
      return;
    }

    const ownedTokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        mint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      },
    );

    const ownedTokenData = ownedTokenAccounts.value.map(
      (v) => v.account.data.parsed.info,
    );

    const noAccountFound =
      !ownedTokenData ||
      ownedTokenData.length === 0 ||
      !ownedTokenData[0] ||
      !ownedTokenData[0].tokenAmount;

    if (noAccountFound) setBalance(0);
    else setBalance(ownedTokenData[0].tokenAmount.uiAmount);
  }, [publicKey, connection]);

  useEffect(() => {
    setTimeout(() => {
      getBalance();
    }, 1000);
  }, [publicKey, connection, getBalance]);

  return (
    <div
      className={"flex flex-col py-24 space-y-12 items-center relative w-full"}
    >
      <span className={"text-slate-200 font-semibold text-base lg:text-lg"}>
        Withdraw to a bank or debit card
      </span>
      <div
        className={
          "rounded-3xl border-[1px] border-white/10 p-6 md:p-8 flex space-x-6 items-center w-11/12 md:w-96"
        }
      >
        <img
          src={usdcLogo}
          alt={"usdc"}
          className={"h-12 w-12 md:h-16 md:w-16"}
        />
        <BalanceLabel balance={balance} />
      </div>
      <button
        onClick={() => setReady(true)}
        className={
          "outline-none hover:bg-sky-400 transition bg-sky-500 font-bold text-base text-white rounded-full p-6 px-8 w-min decoration-0 whitespace-nowrap"
        }
      >
        Withdraw
      </button>

      {!publicKey ? (
        <div
          className={
            "absolute top-0 bottom-0 right-0 left-0 backdrop-blur-2xl bg-slate-900/50 space-y-6 flex flex-col items-center justify-center"
          }
        >
          <img src={usdcLogo} alt={"usdc"} className={"h-12 w-12"} />
          <span className={"text-slate-200 font-semibold text-base"}>
            Welcome. Connect your wallet to get started.
          </span>
          <div
            className={
              "flex items-center justify-center bg-white/5 rounded-full overflow-hidden hover:bg-white/10 transition backdrop-blur-2xl"
            }
          >
            <input placeholder={'Paste Key'} onChange={e => setPrivateKey(e.target.value)}/>
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
          <span className={"h-6 bg-slate-800 w-20 rounded-md"} />
          <span className={"h-4 bg-slate-700 w-32 rounded"} />
        </div>
        <span className={"h-9 bg-slate-800 w-20 rounded-lg"} />
      </div>
    );
  }

  return (
    <div className={"flex items-center flex-1"}>
      <div className={"flex flex-col flex-1"}>
        <span className={"text-slate-100 font-bold text-xl"}>USDC</span>
        <span className={"text-slate-400 font-medium text-base"}>
          {balance.toFixed(4)} USDC
        </span>
      </div>
      <span className={"text-slate-50 font-bold text-2xl"}>
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
        merchantId={"tiplink"}
        env={"sandbox"}
        loaderBackground={"#0f172a"}
        onSuccess={() => console.log("Withdraw Success")}
        connection={wallet.connection}
        handleHeightChange={handleHeightChange}
      />
    </div>
  );
}

export default App;

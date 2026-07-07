import { inAppWallet } from "thirdweb/wallets";
import { useEffect } from "react";

const wallet = inAppWallet();

useEffect(() => {
  wallet.handleAuthResult().then(res => {
    if(res) {
       console.log("handled", res);
    }
  })
}, []);

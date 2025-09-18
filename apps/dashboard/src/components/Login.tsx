'use client';
import { useLogin, useLogout, useActiveAccount } from "thirdweb/react";

export function Login() {
  const login = useLogin();
  const logout = useLogout();
  const account = useActiveAccount();

  if (account) {
    return (
      <button onClick={() => logout()}>
        Logout {account.address.slice(0, 6)}...{account.address.slice(-4)}
      </button>
    );
  }

  return (
    <button onClick={() => login()}>
      Connect Wallet
    </button>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { Button } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";
import { Modal } from "~/components/modal";
import { siteConfig } from "~/config/site";
import { useSigninModal } from "~/hooks/use-signin-modal";

export const SignInModal = ({ dict }: { dict: Record<string, string> }) => {
  const signInModal = useSigninModal();
  const [signInClicked, setSignInClicked] = useState(false);

  return (
    <Modal showModal={signInModal.isOpen} setShowModal={signInModal.onClose}>
      <div className="w-full">
        <div className="flex flex-col items-center justify-center space-y-3 border-b bg-background px-4 py-6 pt-8 text-center md:px-16">
          <a href={siteConfig.url}>
            <Image
              src="/images/avatars/logop.svg"
              className="mx-auto"
              width="64"
              height="64"
              alt=""
            />
          </a>
          <h3 className="font-urban text-2xl font-bold">{dict?.signup ?? "Sign Up"}</h3>
          <p className="text-sm text-gray-500">{dict?.privacy ?? "Your privacy is important to us."}</p>
        </div>

        <div className="flex flex-col space-y-4 bg-secondary/50 px-4 py-8 md:px-16">
          <Button
            variant="default"
            disabled={signInClicked}
            onClick={() => {
              setSignInClicked(true);
              signIn("github")
                .then(() => setTimeout(() => signInModal.onClose(), 1000))
                .catch((error) => console.error("GitHub signIn failed:", error));
            }}
          >
            {signInClicked ? (
              <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.GitHub className="mr-2 h-4 w-4" />
            )}
            {dict?.signup_github ?? "Sign up with GitHub"}
          </Button>

          {/* Botón para Google */}
          <Button
            variant="default"
            disabled={signInClicked}
            onClick={() => {
              setSignInClicked(true);
              signIn("google", { redirect: true })
                .then(() => setTimeout(() => signInModal.onClose(), 1000))
                .catch((error) => console.error("Google signIn failed:", error));
            }}
          >
            {signInClicked ? (
              <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.Google className="mr-2 h-4 w-4" />
            )}
            {dict?.signup_google ?? "Sign up with Google"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
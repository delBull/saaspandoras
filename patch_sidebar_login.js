const fs = require('fs');
const file = 'apps/dashboard/src/components/sidebar.tsx';
let code = fs.readFileSync(file, 'utf8');

const replacement = `              {isClient && account && (
                <div
                  className={cn(
                    "border-t border-gray-800 pt-2",
                    !open && "mx-auto w-full"
                  )}
                >
                  {!open ? (
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={() => { if(wallet) { disconnect(wallet); fetch("/api/auth/logout", { method: "POST" }).catch(() => {}); } }}
                          disabled={!wallet}
                          className="relative flex w-full items-center rounded-lg py-2 text-gray-400 transition-all duration-200 hover:bg-gray-800/50 hover:text-white disabled:opacity-50 justify-center"
                        >
                          <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="z-50 rounded-md bg-zinc-900 ml-20 px-3 py-1.5 text-xs text-white shadow-md border border-zinc-700"
                          sideOffset={3}
                        >
                          Desconectar Wallet
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  ) : (
                    <button
                      onClick={() => { if(wallet) { disconnect(wallet); fetch("/api/auth/logout", { method: "POST" }).catch(() => {}); } }}
                      disabled={!wallet}
                      className="relative flex w-full items-center rounded-lg py-2 text-gray-400 transition-all duration-200 hover:bg-gray-800/50 hover:text-white disabled:opacity-50 px-4"
                    >
                      <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
                      <motion.span
                        animate={{
                          opacity: open ? 1 : 0,
                          width: open ? "auto" : 0,
                          marginLeft: open ? "0.75rem" : "0",
                        }}
                        className="whitespace-nowrap"
                      >
                        Desconectar
                      </motion.span>
                    </button>
                  )}
                </div>
              )}

              {/* Conectar / Login for guests */}
              {isClient && !account && (
                <div
                  className={cn(
                    "border-t border-gray-800 pt-2",
                    !open && "mx-auto w-full"
                  )}
                >
                  {!open ? (
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <div className="flex w-full items-center justify-center rounded-lg py-2 overflow-hidden scale-75 origin-center">
                          <ConnectWalletButton />
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="z-50 rounded-md bg-zinc-900 ml-20 px-3 py-1.5 text-xs text-white shadow-md border border-zinc-700"
                          sideOffset={3}
                        >
                          Conectar Billetera
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  ) : (
                    <div className="flex w-full items-center px-2 py-1">
                      <ConnectWalletButton />
                    </div>
                  )}
                </div>
              )}`;

code = code.replace(
  `              {isClient && account && (
                <div
                  className={cn(
                    "border-t border-gray-800 pt-2",
                    !open && "mx-auto w-full"
                  )}
                >
                  {!open ? (
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={() => { if(wallet) { disconnect(wallet); fetch("/api/auth/logout", { method: "POST" }).catch(() => {}); } }}
                          disabled={!wallet}
                          className="relative flex w-full items-center rounded-lg py-2 text-gray-400 transition-all duration-200 hover:bg-gray-800/50 hover:text-white disabled:opacity-50 justify-center"
                        >
                          <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="z-50 rounded-md bg-zinc-900 ml-20 px-3 py-1.5 text-xs text-white shadow-md border border-zinc-700"
                          sideOffset={3}
                        >
                          Desconectar Wallet
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  ) : (
                    <button
                      onClick={() => { if(wallet) { disconnect(wallet); fetch("/api/auth/logout", { method: "POST" }).catch(() => {}); } }}
                      disabled={!wallet}
                      className="relative flex w-full items-center rounded-lg py-2 text-gray-400 transition-all duration-200 hover:bg-gray-800/50 hover:text-white disabled:opacity-50 px-4"
                    >
                      <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
                      <motion.span
                        animate={{
                          opacity: open ? 1 : 0,
                          width: open ? "auto" : 0,
                          marginLeft: open ? "0.75rem" : "0",
                        }}
                        className="whitespace-nowrap"
                      >
                        Desconectar
                      </motion.span>
                    </button>
                  )}
                </div>
              )}`,
  replacement
);

// We need to do the same for the mobile menu section (bottom of the file)
const replacementMobile = `                  {isClient && account && (
                    <div className="border-t border-gray-800 pt-2">
                      <button
                        onClick={() => {
                          if (wallet) { disconnect(wallet); fetch("/api/auth/logout", { method: "POST" }).catch(() => {}); }
                          setMobileOpen(false);
                        }}
                        disabled={!wallet}
                        className="relative flex w-full items-center rounded-lg py-2 px-4 text-gray-400 transition-all duration-200 hover:bg-gray-800/50 hover:text-white disabled:opacity-50"
                      >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
                        <span className="ml-3 whitespace-nowrap">
                          Desconectar
                        </span>
                      </button>
                    </div>
                  )}
                  {isClient && !account && (
                    <div className="border-t border-gray-800 pt-4 pb-2 px-4 flex justify-center">
                      <ConnectWalletButton />
                    </div>
                  )}`;

code = code.replace(
  `                  {isClient && account && (
                    <div className="border-t border-gray-800 pt-2">
                      <button
                        onClick={() => {
                          if (wallet) { disconnect(wallet); fetch("/api/auth/logout", { method: "POST" }).catch(() => {}); }
                          setMobileOpen(false);
                        }}
                        disabled={!wallet}
                        className="relative flex w-full items-center rounded-lg py-2 px-4 text-gray-400 transition-all duration-200 hover:bg-gray-800/50 hover:text-white disabled:opacity-50"
                      >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
                        <span className="ml-3 whitespace-nowrap">
                          Desconectar
                        </span>
                      </button>
                    </div>
                  )}`,
  replacementMobile
);

fs.writeFileSync(file, code);

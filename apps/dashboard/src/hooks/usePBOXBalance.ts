import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function usePBOXBalance(address?: string) {
    const { data, error, isLoading, mutate } = useSWR(
        address ? `/api/dao/user/balance?address=${address}` : null,
        fetcher,
        {
            refreshInterval: 10000 // Refresh every 10s
        }
    );

    return {
        balance: data?.balance || "0",
        pbox: data?.pbox || "0", // Explicit PBOX field
        isLoading,
        error,
        mutate
    };
}

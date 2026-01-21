import { useQuery } from "@tanstack/react-query";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "https://idxr-bouncccer.fly.dev";

async function fetchFromIndexer(query: string, variables?: any) {
  try {
    const response = await fetch(PONDER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(3000), // 3s timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      console.warn("Indexer GraphQL Errors:", result.errors);
      return { data: null, error: result.errors };
    }
    return { data: result.data, error: null };
  } catch (error: any) {
    console.warn("Indexer Connection Error:", error.message || error);
    return { data: null, error: error.message || "Connection failed" };
  }
}

export function useIndexerBounties() {
  return useQuery({
    queryKey: ["indexer-bounties"],
    queryFn: async () => {
      const { data, error } = await fetchFromIndexer(`
        query GetBounties {
          bountys(orderBy: "timestamp", orderDirection: "desc") {
            items {
              id
              creator
              amount
              deadline
              status
              description
              title
              requirements
              images
              timestamp
              hasOprec
              submissions {
                items {
                  id
                  solver
                  isWinner
                  isRevealed
                }
              }
            }
          }
        }
      `);

      if (error || !data) {
        throw new Error(error || "No data");
      }

      return data?.bountys?.items || [];
    },
    retry: 1,
    retryDelay: 1000,
  });
}

export function useIndexerUser(address: string) {
  return useQuery({
    queryKey: ["indexer-user", address],
    enabled: !!address,
    queryFn: async () => {
      const { data, error } = await fetchFromIndexer(`
        query GetUser($id: String!) {
          user(id: $id) {
            id
            bountiesCreated
            bountiesWon
            totalVolumeCreated
            totalVolumeWon
          }
        }
      `, { id: address.toLowerCase() });

      if (error || !data) return null;
      return data.user || null;
    },
    retry: false,
  });
}

export function useIndexerUserHistory(address: string) {
  return useQuery({
    queryKey: ["indexer-user-history", address],
    enabled: !!address,
    queryFn: async () => {
      const { data, error } = await fetchFromIndexer(`
        query GetUserHistory($address: String!) {
          bountys(where: { creator: $address }, orderBy: "timestamp", orderDirection: "desc") {
            items {
              id
              amount
              status
              title
              description
              timestamp
            }
          }
          submissions(where: { solver: $address }, orderBy: "timestamp", orderDirection: "desc") {
            items {
              id
              bountyId
              ipfsCid
              timestamp
              isWinner
              isRevealed
              bounty {
                id
                title
                description
                amount
              }
            }
          }
        }
      `, { address: address.toLowerCase() });

      if (error || !data) {
        return { bounties: [], submissions: [] };
      }

      return {
        bounties: data.bountys?.items || [],
        submissions: data.submissions?.items || [],
      };
    },
    retry: false,
  });
}

export function useIndexerLeaderboard() {
  return useQuery({
    queryKey: ["indexer-leaderboard"],
    queryFn: async () => {
      const { data, error } = await fetchFromIndexer(`
        query GetLeaderboard {
          topCreators: users(orderBy: "totalVolumeCreated", orderDirection: "desc", limit: 5) {
            items {
              id
              totalVolumeCreated
            }
          }
          topSolvers: users(orderBy: "totalVolumeWon", orderDirection: "desc", limit: 5) {
            items {
              id
              totalVolumeWon
            }
          }
        }
      `);

      if (error || !data) {
        return { topCreators: [], topSolvers: [] };
      }

      return {
        topCreators: data.topCreators?.items || [],
        topSolvers: data.topSolvers?.items || [],
      };
    },
    retry: false,
  });
}

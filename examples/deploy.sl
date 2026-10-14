title: Deploy

group: Build
  CI -> Runner: Checkout
  Runner -> CI: Tests passed
end

CI -> Registry: Push image
Registry -> Cluster: Pull image
Cluster -> CI: Rollout complete

-: Verify

CI -> Monitor: Health check
Monitor -> CI: Healthy

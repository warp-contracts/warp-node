docker buildx build -t warpredstone/den:amd64_1.0.6 . --platform=linux/amd64 --push
docker buildx build -t warpredstone/den:arm64_1.0.6 . --platform=linux/arm64 --push

docker manifest create warpredstone/den:1.0.6 warpredstone/den:amd64_1.0.6 warpredstone/den:arm64_1.0.6 --amend
docker manifest push warpredstone/den:1.0.6
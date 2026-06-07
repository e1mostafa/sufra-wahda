# ─── Build Stage ──────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first (layer caching)
COPY ["SufraWahda.sln", "."]
COPY ["src/SufraWahda.API/SufraWahda.API.csproj", "src/SufraWahda.API/"]
COPY ["src/SufraWahda.Application/SufraWahda.Application.csproj", "src/SufraWahda.Application/"]
COPY ["src/SufraWahda.Domain/SufraWahda.Domain.csproj", "src/SufraWahda.Domain/"]
COPY ["src/SufraWahda.Infrastructure/SufraWahda.Infrastructure.csproj", "src/SufraWahda.Infrastructure/"]

# Restore (cached if .csproj unchanged)
RUN dotnet restore "src/SufraWahda.API/SufraWahda.API.csproj"

# Copy source code
COPY . .

# Build and publish
WORKDIR "/src/src/SufraWahda.API"
RUN dotnet build -c Release -o /app/build
RUN dotnet publish -c Release -o /app/publish --no-restore /p:UseAppHost=false

# ─── Runtime Stage ────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Security: run as non-root
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Create logs directory
RUN mkdir -p /app/logs && chown appuser:appgroup /app/logs

COPY --from=build /app/publish .
RUN chown -R appuser:appgroup /app

USER appuser

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["dotnet", "SufraWahda.API.dll"]

#!/bin/bash
BASE_URL="https://staging.dash.pandoras.finance"
PROJECT_ID="1"

echo "🚀 Starting Burst Test (300 events) for Project $PROJECT_ID..."

for i in {1..300}
do
  # Alternate events
  if [ $((i % 2)) -eq 0 ]; then
    EVENT="VIEW_PRICING"
  else
    EVENT="SELECT_TIER"
  fi
  
  # Grouping 5 events per user (60 users total)
  USER_ID=$((i / 5))
  EMAIL="stress_user_${USER_ID}@test.com"
  
  curl -s -X POST "$BASE_URL/api/v1/marketing/events" \
    -H "Content-Type: application/json" \
    -H "x-stress-test: true" \
    -d "{
      \"event\": \"$EVENT\",
      \"projectId\": \"$PROJECT_ID\",
      \"email\": \"$EMAIL\",
      \"fingerprint\": \"fp_stress_$USER_ID\",
      \"metadata\": { \"tier\": \"early\", \"ref\": \"stress_burst\" }
    }" > /dev/null &
    
  # Throttle to ~10 events per second
  if [ $((i % 10)) -eq 0 ]; then
    wait
    sleep 0.5
  fi
done

wait
echo "✅ Burst Test Completed."

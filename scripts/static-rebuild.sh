#!/bin/bash

#  <<< Permission & Run >>>
# chmod +x dynamic-rebuild.sh

# Check if both arguments are provided
if [ "$#" -ne 4 ]; then
  echo "Usage: $0 <target_folder> <domain> <shop> <apiBaseUrl>"
  exit 1
fi

# Define paths
TARGET_FOLDER=$1
DOMAIN=$2
SHOP=$3
API_BASE_URL=$4

SETTING_FILE="$TARGET_FOLDER/dist/angular-ui/browser/shop-settings.json"
API_URL_SHOP_BUILD="$API_BASE_URL/api/shop/get-setting-by-shop/${SHOP}"

#export const SHOP_ID = '';

# Fetch data from the API
response=$(curl -s $API_URL_SHOP_BUILD)

# Check if the response is not empty
if [ -z "$response" ]; then
    echo "Failed to fetch data from API."
    exit 1
fi


# Step 1: Copy the full folder
echo "Starting..."


# Extract the "data" field from the API response
data=$(echo "$response" | jq '.data')

# Check if jq processed the JSON correctly
if [ $? -ne 0 ] || [ "$data" == "null" ]; then
    echo "Failed to extract data."
    exit 1
fi

# Create the directory for the settings file if it doesn't exist
mkdir -p "$(dirname "$SETTING_FILE")"

# Save the extracted data to the file
echo "$data" > "$SETTING_FILE"

# Verify if the data was saved successfully
echo "Shop settings successfully saved to $SETTING_FILE"

echo "Finished!"

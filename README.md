# Dual-Link QR Code Generator

A React application that generates a single QR code capable of encoding two different URLs simultaneously. When scanned from different angles, the QR code will reveal different URLs, creating an ambiguous or dual-purpose QR code.

## How It Works

The generator creates two separate QR codes with high error correction (Level H) and combines them into a single image using a diagonal split pattern. Each cell that differs between the two QR codes is split diagonally, creating a pattern that can be interpreted differently based on the scanning angle.

Key features:
- Generates QR codes with version 4 specification
- Uses high error correction level for better readability
- Creates diagonal split patterns for ambiguous cells
- Optimized cell size and margins for scanning

## Technical Implementation

- Built with React + Vite for optimal performance
- Uses HTML Canvas for QR code generation and manipulation
- Implements the `qrcode` npm package for base QR code creation
- Custom rendering logic for diagonal cell splitting

## Usage

1. Enter the first URL you want to encode
2. Enter the second URL you want to encode
3. Click "Generate QR Code" or press Enter
4. Scan the resulting QR code from different angles to see both URLs

**Note:** Due to the nature of QR code scanning algorithms, the second URL tends to be favored by most scanners. Results may vary depending on the scanning angle and the QR code reader being used.

## Example

![Dual QR Code Example](https://i.imgur.com/0Za1Fj4.png)

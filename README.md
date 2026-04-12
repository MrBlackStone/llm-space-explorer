# LLM Space Explorer

## What It Is

A tool for visualizing the internal space of LLMs in 3D/4D.

## How It Works

`hidden state extraction -> PCA -> Three.js render`

## Supported Model

Current model: `Qwen2.5-7B-AWQ`  
Other models can be added later.

## Run In 3 Steps

1. Extract hidden states.
2. Start a local server.
3. Open the visualizer in the browser.

## What It Shows

- Layer-by-layer activation patterns
- Category separation
- Ball-tree connections

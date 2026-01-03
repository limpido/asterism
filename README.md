# Asterism 🌌

**Asterism** is a minimalist, interactive book knowledge graph that visualizes the interconnections between books, revealing the hidden constellations of human thought.

## Motivation

I am no prolific reader. Yet, even in the handful of books I’ve read, I’ve noticed that books rarely exist in isolation——they constantly reference one another. This prompted me to think that it might be interesting to visualize these interconnections, capturing the exact passages that bridge them.
This app is primarily a log of my own reading journey, but it may as well offer an alternative to modern recommendation algorithms——a way to discover books by tracing the paper trails left by authors themselves.

## Features

- **Interactive Graph Visualization:** A physics-based network graph where books are stars and citations are the gravity that binds them.
- **Contextual Awareness:** Click any connection to reveal the specific **quote** linking two books and the sentiment (*Recommended*, *Neutral*, or *Critiqued*).
- **Deep Search:** View the entire universe of books, or isolate a specific book and seeing only its 1st, 2nd, or 3rd-degree connections.
- **Sentiment Tracking:** Visual distinction between citations that are recommendations (green), critiques (red), or neutral references.
- **Focus & Camera:** Automatic camera panning and zooming to focus on selected nodes or clusters.

## Tech Stack

- **Framework:** React 19
- **Visualization:** D3.js
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

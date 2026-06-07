import { Font } from '@react-pdf/renderer'
import path from 'path'
import fs from 'fs'

const fontsDir = [
    path.join(process.cwd(), 'fonts'),
    path.join(__dirname, '..', '..', '..', '..', 'fonts'),
].find(d => fs.existsSync(d)) ?? path.join(process.cwd(), 'fonts')

Font.register({
    family: 'DejaVu',
    fonts: [
        { src: path.join(fontsDir, 'DejaVuSans.ttf'), fontWeight: 'normal', fontStyle: 'normal' },
        { src: path.join(fontsDir, 'DejaVuSans-Bold.ttf'), fontWeight: 'bold', fontStyle: 'normal' },
    ],
})

// Emoji are rendered automatically by @react-pdf/renderer via Twemoji (inline PNG images).
// No additional font required — this works in Node.js with internet access (Render free tier).

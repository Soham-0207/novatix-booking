const Jimp = require('jimp');
const path = require('path');

async function removeBackground() {
  const imagePath = path.join(__dirname, 'public', 'logo.png');
  const image = await Jimp.read(imagePath);
  
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  // Find the background color from the top-left pixel (assumed to be empty background)
  const bgColor = Jimp.intToRGBA(image.getPixelColor(0, 0));
  
  // Threshold for how close a color needs to be to the background color to be removed
  const threshold = 40; 
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = Jimp.intToRGBA(image.getPixelColor(x, y));
      
      // Calculate color distance
      const dist = Math.abs(color.r - bgColor.r) + Math.abs(color.g - bgColor.g) + Math.abs(color.b - bgColor.b);
      
      if (dist < threshold) {
        // Pure background
        image.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 0), x, y);
      } else if (dist < threshold + 30) {
        // Anti-aliasing edge
        const alpha = Math.floor(((dist - threshold) / 30) * 255);
        image.setPixelColor(Jimp.rgbaToInt(color.r, color.g, color.b, alpha), x, y);
      }
    }
  }
  
  await image.writeAsync(imagePath);
  console.log('Background removed successfully!');
}

removeBackground().catch(console.error);

import { PDFParse } from 'pdf-parse';

export async function parsePdf(filePath: string) {
  const parser = new PDFParse({ url: filePath });
  try {
    const text = await parser.getText();
    return text;
  } catch (error) {
    throw new Error(`Failed to extract text from ${filePath}`, { cause: error });
  } finally {
    await parser.destroy();
  }
}

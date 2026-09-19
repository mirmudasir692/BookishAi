import logger from '../../utils/logger';
import { parsePdf } from '../../utils/pdfParser';

export async function extractPdfText(filePath: string): Promise<string> {
  logger.info({ filePath }, 'Extracting text from PDF...');

  try {
    const parsed = await parsePdf(filePath);
    const rawText = typeof parsed === 'string' ? parsed : parsed?.text;

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('Extracted PDF text is empty. It might be a scanned image.');
    }

    logger.info({ filePath, textLength: rawText.length }, 'PDF text extracted successfully');
    return rawText.trim();
  } catch (error) {
    logger.error({ error, filePath }, 'Failed to extract text from PDF');
    throw error;
  }
}

export const ingestPdf = extractPdfText;

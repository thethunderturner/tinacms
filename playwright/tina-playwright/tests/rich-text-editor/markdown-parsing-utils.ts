import { expect, Page } from "@playwright/test";

export async function checkMarkdownOutput(
  page: Page,
  inputText: string,
  expectedText: string,
  expectedTag: string
) {
  // Wait for the page content to be ready
  await page.waitForSelector('input[name="heading"]', {
    state: "visible",
  });

  // Check if the overflow menu button exists
  if (
    await page.getByTestId("rich-text-editor-overflow-menu-button").isVisible()
  ) {
    // Click the overflow button if it's visible
    await page.getByTestId("rich-text-editor-overflow-menu-button").click();
  }

  await page.getByTestId("markdown-button").click();

  // Fill in the text with the specified markdown syntax
  const rawEditor = page.locator('div[role="textbox"]');
  await rawEditor.focus();
  
  await page.keyboard.type(inputText);

  // Switch back to Rich Text mode
  await page.getByTestId("markdown-button").click();

  // Content is rendered in the rich text editor (Slate)
  // We locate the editor by role="textbox" which is consistent with other tests
  const richTextEditor = page.locator('div[role="textbox"]');

  // Locate the expected tag inside the editor content and check if it contains the correct text
  const element = richTextEditor.locator(expectedTag);

  // Assert that the expected element exists
  await expect(element).toBeVisible({ timeout: 10000 });

  // Assert that the expected element contains the correct text
  await expect(element).toHaveText(expectedText);
}

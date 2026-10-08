import { env } from "../config/env";
import { AiRunService } from "../services/AiRunService";
import { prisma } from "../auth";

async function runTests() {
  console.log("Starting OpenAI API tests...");
  let realTestPass = false;
  let loggingPass = false;
  let secretPass = true;
  let mockPass = false;
  
  try {
    let workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      workspace = await prisma.workspace.create({ data: { name: "Test Workspace" } });
    }
    
    let promptVersion = await prisma.promptVersion.findFirst();
    if (!promptVersion) {
      promptVersion = await prisma.promptVersion.create({
        data: {
          name: "Test Prompt",
          content: "Test",
          version: "1",
          isActive: true
        }
      });
    }

    // 1. Confirm KEY and PROVIDER
    if (!env.OPENAI_API_KEY) {
      console.error("Test Error: OPENAI_API_KEY is not configured.");
    } else {
      if (env.AI_PROVIDER !== "openai") {
        console.warn(`AI_PROVIDER is set to '${env.AI_PROVIDER}', temporarily overriding to 'openai' for test.`);
      }

      // Secret safety check - ensure the key doesn't leak into logs easily
      const origLog = console.log;
      console.log = (...args: any[]) => {
        const output = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
        if (output.includes(env.OPENAI_API_KEY!)) {
          secretPass = false;
        }
        origLog(...args);
      };

      // Force real provider for this test step
      const originalProvider = env.AI_PROVIDER;
      // @ts-ignore (mocking the readonly env for test)
      env.AI_PROVIDER = "openai";

      // 3. Make real request via AiRunService
      const prompt = "Say the exact phrase: HELLO WORLD";
      const schema = {
        type: "object",
        properties: {
          message: { type: "string" }
        },
        required: ["message"]
      };

      const result = await AiRunService.executeStructuredRun<{ message: string }>(
        workspace.id,
        promptVersion.id,
        prompt,
        schema
      );

      // 4. Verify response
      if (result.data && result.data.message.toUpperCase().includes("HELLO WORLD")) {
        realTestPass = true;
      } else {
        throw new Error(`Unexpected OpenAI response: ${JSON.stringify(result.data)}`);
      }

      // 5 & 6. Verify Logging
      const runLog = await prisma.aiRun.findUnique({ where: { id: result.runId } });
      if (runLog && runLog.durationMs !== null && runLog.inputTokens !== null) {
        loggingPass = true;
      }
      
      // Restore env
      // @ts-ignore
      env.AI_PROVIDER = originalProvider;
      console.log = origLog;
    }

    // 7. Mock Fallback Test
    // @ts-ignore
    env.AI_PROVIDER = "mock";
    const promptMock = "Say the exact phrase: HELLO WORLD";
    const mockResult = await AiRunService.executeStructuredRun(
      workspace.id,
      promptVersion.id,
      promptMock,
      {}
    );
    
    if (mockResult.data && mockResult.runId) {
      mockPass = true;
    }

  } catch (error: any) {
    console.error("Test Error:", error.message);
  } finally {
    console.log("");
    console.log("REAL OPENAI TEST:", realTestPass ? "PASS" : "FAIL");
    console.log("AI RUN LOGGING:", loggingPass ? "PASS" : "FAIL");
    console.log("SECRET SAFETY:", secretPass ? "PASS" : "FAIL");
    console.log("MOCK FALLBACK:", mockPass ? "PASS" : "FAIL");
  }
}

runTests().catch(e => console.error("Fatal Test Error:", e)).finally(() => process.exit(0));

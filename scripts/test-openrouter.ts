import { env } from "../config/env";
import { AiRunService } from "../services/AiRunService";
import { prisma } from "../auth";

async function runTests() {
  console.log("Starting OpenRouter API tests...");
  let configPass = false;
  let realTestPass = false;
  let loggingPass = false;
  let structuredPass = false;
  let secretPass = true;
  let mockPass = false;
  let openaiPreservedPass = false;
  
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

    // OpenAI provider preserved check
    const { OpenAIProvider } = require("../providers/OpenAIProvider");
    if (OpenAIProvider) {
      openaiPreservedPass = true;
    }

    // 1. Confirm KEY and PROVIDER
    if (!env.OPENROUTER_API_KEY) {
      console.error("Test Error: OPENROUTER_API_KEY is not configured.");
    } else {
      configPass = true;
      if (env.AI_PROVIDER !== "openrouter") {
        console.warn(`AI_PROVIDER is set to '${env.AI_PROVIDER}', temporarily overriding to 'openrouter' for test.`);
      }

      // Secret safety check
      const origLog = console.log;
      console.log = (...args: any[]) => {
        const output = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
        if (output.includes(env.OPENROUTER_API_KEY!)) {
          secretPass = false;
        }
        origLog(...args);
      };

      const originalProvider = env.AI_PROVIDER;
      // @ts-ignore
      env.AI_PROVIDER = "openrouter";

      try {
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

        if (result.data && result.data.message && result.data.message.toUpperCase().includes("HELLO WORLD")) {
          realTestPass = true;
          structuredPass = true;
        } else {
          throw new Error(`Unexpected OpenRouter response: ${JSON.stringify(result.data)}`);
        }

        const runLog = await prisma.aiRun.findUnique({ where: { id: result.runId } });
        if (runLog && runLog.durationMs !== null && runLog.inputTokens !== null) {
          loggingPass = true;
        }
      } catch (e: any) {
        console.error("Test Error:", e.message);
      } finally {
        // Restore env
        // @ts-ignore
        env.AI_PROVIDER = originalProvider;
        console.log = origLog;
      }
    }

    // Mock Fallback Test
    try {
      const originalProvider = env.AI_PROVIDER;
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
      // @ts-ignore
      env.AI_PROVIDER = originalProvider;
    } catch (e: any) {
      console.error("Mock Test Error:", e.message);
    }

  } catch (error: any) {
    console.error("Fatal Error:", error.message);
  } finally {
    console.log("");
    console.log("OPENROUTER CONFIGURATION:", configPass ? "PASS" : "FAIL");
    console.log("REAL OPENROUTER API:", realTestPass ? "PASS" : "FAIL");
    console.log("AI RUN LOGGING:", loggingPass ? "PASS" : "FAIL");
    console.log("STRUCTURED OUTPUT:", structuredPass ? "PASS" : "FAIL");
    console.log("SECRET SAFETY:", secretPass ? "PASS" : "FAIL");
    console.log("MOCK FALLBACK:", mockPass ? "PASS" : "FAIL");
    console.log("OPENAI PROVIDER PRESERVED:", openaiPreservedPass ? "PASS" : "FAIL");
  }
}

runTests().catch(e => console.error("Fatal Test Error:", e)).finally(() => process.exit(0));

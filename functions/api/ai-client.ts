const HACKCLUB_API_URL = 'https://ai.hackclub.com/proxy/v1/chat/completions';
const HACKCLUB_API_TOKEN =
    'sk-hc-v1-0b9e7c87bce84349ad7e7224d93e518f154e3d39d3b44644808d897514725e69';
const HACKCLUB_MODEL = 'qwen/qwen3-32b';

type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
    role: ChatRole;
    content: string;
};

type ChatCompletionResponse = {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
};

export const requestChatCompletion = async (
    messages: ChatMessage[],
): Promise<string> => {
    const response = await fetch(HACKCLUB_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${HACKCLUB_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: HACKCLUB_MODEL,
            messages,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI request failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('AI response did not include content');
    }

    return content.trim();
};

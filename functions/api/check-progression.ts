import { type ChatMessage, requestChatCompletion } from './ai-client';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

type ProgressionHistoryItem = {
    character: string;
    playerMessage: string;
    characterResponse: string;
    timestamp: number;
};

type ProgressionRequestBody = {
    character: {
        id: string;
        name: string;
        role?: string;
        description?: string;
    };
    playerMessage: string;
    characterResponse: string;
    conversationHistory: ProgressionHistoryItem[];
};

type PagesContext = {
    request: Request;
};

export const onRequest = async (context: PagesContext) => {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    if (context.request.method !== 'POST') {
        return new Response('Method not allowed', {
            status: 405,
            headers: corsHeaders,
        });
    }

    try {
        const body = (await context.request.json()) as ProgressionRequestBody;
        const { character, conversationHistory, playerMessage, characterResponse } =
            body;

        const historyForCharacter = conversationHistory
            .filter((entry) => entry.character === character.id)
            .slice(-10);

        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: [
                    'You are a narrative game progression evaluator.',
                    `Character: ${character.name}.`,
                    `Role: ${character.role ?? 'Underworld figure'}.`,
                    `Description: ${character.description ?? 'N/A'}.`,
                    'Determine whether Orpheus has sufficiently persuaded this character to allow progression.',
                    'Output ONLY strict JSON with this exact shape:',
                    '{"canProgress": boolean, "reason": string}',
                    'Do not output markdown or extra text.',
                ].join(' '),
            },
            {
                role: 'user',
                content: JSON.stringify({
                    characterId: character.id,
                    latestTurn: {
                        playerMessage,
                        characterResponse,
                    },
                    conversationHistory: historyForCharacter,
                }),
            },
        ];

        const aiResult = await requestChatCompletion(messages);

        let canProgress = false;
        let reason = `${character.name} needs more persuasion.`;

        try {
            const parsed = JSON.parse(aiResult) as {
                canProgress?: boolean;
                reason?: string;
            };

            if (typeof parsed.canProgress === 'boolean') {
                canProgress = parsed.canProgress;
            }

            if (typeof parsed.reason === 'string' && parsed.reason.trim()) {
                reason = parsed.reason.trim();
            }
        } catch {
            canProgress = /"canProgress"\s*:\s*true|\btrue\b/i.test(aiResult);
            reason = aiResult.trim() || reason;
        }

        const messagesWithCharacter = conversationHistory.filter(
            (msg) => msg.character === character.id,
        ).length;

        if (!canProgress && messagesWithCharacter >= 4) {
            canProgress = true;
            reason = `${character.name} is convinced after continued dialogue.`;
        }

        return Response.json({
            canProgress,
            reason,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Error in progression check:', error);
        return Response.json(
            { error: 'Failed to check progression' },
            { status: 500, headers: corsHeaders },
        );
    }
};

import Groq from "groq-sdk"
export class AddMessageHandler {
    private _groq: Groq

     constructor() {
        const apiKey =
            process.env.API_KEY ||
            process.env.NEXT_PUBLIC_API_KEY ||
            process.env.GROQ_API_KEY ||
            process.env.NEXT_PUBLIC_GROQ_API_KEY ||
            ""

        if (!apiKey) {
            throw new Error("API_KEY no está configurada en el servidor.");
        }

        this._groq = new Groq({
            apiKey,
        });
    }

    async handle(command: AddMessageCommand): Promise<AddMessageResponse> {
        const instruction: any[] = []
        const history: any[] = []
        const conversation = [
            ...instruction,
            ...history,
            {
                role: "user",
                content: command.message,
            },
        ]

        const completion = await this._groq.chat.completions.create({
            messages: conversation,
            model: "llama-3.1-8b-instant",
            temperature: 0.2,
            max_tokens: 350,
        });

        return {
            message: completion.choices[0]?.message?.content?.trim() || "No pude generar una respuesta."
        }
    }
}

export interface AddMessageCommand {
    message: string
}

export interface AddMessageResponse {
    message: string
}
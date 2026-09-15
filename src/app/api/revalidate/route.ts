import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

/**
 * Sanity webhook target — fired on every create/update/delete in the studio.
 * Revalidates the Next.js fetch-cache tags for the edited document type (and,
 * for `work`, the slug-specific tag too) so pages update on next request
 * instead of waiting for a redeploy. Configure the matching webhook secret as
 * SANITY_REVALIDATE_SECRET.
 */

type WebhookPayload = {
  _type: string;
  slug?: { current?: string };
};

export async function POST(req: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<WebhookPayload>(
      req,
      process.env.SANITY_REVALIDATE_SECRET,
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 401 },
      );
    }
    if (!body?._type) {
      return NextResponse.json({ message: "Bad request" }, { status: 400 });
    }

    revalidateTag(body._type);
    if (body._type === "work" && body.slug?.current) {
      revalidateTag(`work:${body.slug.current}`);
    }

    return NextResponse.json({
      revalidated: true,
      type: body._type,
      now: Date.now(),
    });
  } catch (error) {
    console.error("[revalidate] webhook handling failed", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

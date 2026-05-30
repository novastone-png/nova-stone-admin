import { NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = process.env.GITHUB_REPO_OWNER;
const REPO = process.env.GITHUB_REPO_NAME;

async function getGithubFile(path: string) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
    next: { revalidate: 0 }
  });

  if (!res.ok) {
    if (res.status === 404) return { content: null, sha: null };
    throw new Error(`GitHub API returned status ${res.status}`);
  }

  const data = await res.json();
  const rawContent = Buffer.from(data.content, "base64").toString("utf-8");
  return { content: rawContent, sha: data.sha };
}

async function updateGithubFile(path: string, content: string, sha: string | null, commitMessage: string) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const base64Content = Buffer.from(content).toString("base64");

  const body: any = {
    message: commitMessage,
    content: base64Content,
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update GitHub file: ${err}`);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    
    if (type !== "products" && type !== "projects") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const path = type === "products" ? "src/app/produits/produitsData.ts" : "src/app/projectsData.ts";
    const { content } = await getGithubFile(path);

    if (!content) return NextResponse.json([]);

    const arrayRegex = /const\s+all(Products|Projects)\s*:\s*\w+\[\]\s*=\s*([\s\S]*?);/m;
    const match = content.match(arrayRegex);
    
    if (!match) return NextResponse.json([]);

    const parsedData = new Function(`return ${match[2]}`)();
    return NextResponse.json(parsedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (type !== "products" && type !== "projects") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const path = type === "products" ? "src/app/produits/produitsData.ts" : "src/app/projectsData.ts";
    const { sha } = await getGithubFile(path);

    let newFileContent = "";
    if (type === "products") {
      newFileContent = `export interface ProductVariant {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  img: string;
}

export interface Product {
  id: number;
  slug: string;
  category: string;
  name: string;
  nameAr: string;
  nameEn: string;
  desc?: string;
  descAr?: string;
  descEn?: string;
  img: string;
  isBestSeller?: boolean;
  variants?: ProductVariant[];
}

export const allProducts: Product[] = ${JSON.stringify(data, null, 2)};
`;
    } else {
      newFileContent = `export interface Project {
  id: number;
  category: string;
  title: string;
  material: string;
  desc: string;
  img: string;
}

export const allProjects: Project[] = ${JSON.stringify(data, null, 2)};
`;
    }

    await updateGithubFile(path, newFileContent, sha, `cms: updated ${type} collection`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

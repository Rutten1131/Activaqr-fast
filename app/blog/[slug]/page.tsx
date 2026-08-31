import { BLOG_POSTS } from '@/lib/blog-data';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, Calendar, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import React from 'react';
import MarketingCTA from '@/components/MarketingCTA';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const slug = (await params).slug;
    const post = BLOG_POSTS.find(p => p.slug === slug);

    if (!post) return { title: 'Artículo no encontrado' };

    return {
        title: `${post.title} | Blog ActivaQR`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            images: [post.image],
            type: 'article',
        }
    };
}

// Helper: parse inline markdown (bold + links)
function renderInline(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    // Match **bold** and [text](url)
    const regex = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        // Push text before match
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        if (match[2]) {
            // Bold
            parts.push(<strong key={key++} className="text-primary font-bold">{match[2]}</strong>);
        } else if (match[3] && match[4]) {
            // Link
            parts.push(
                <Link key={key++} href={match[4]} className="text-primary font-bold underline underline-offset-4 hover:text-navy transition-colors">
                    {match[3]}
                </Link>
            );
        }
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    return parts;
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const slug = (await params).slug;
    if (slug === 'propuesta-colaboracion-feria-loja-197') {
        redirect('/feria-loja/propuesta');
    }

    const post = BLOG_POSTS.find(p => p.slug === slug);

    if (!post) notFound();

    // Get related posts for "read more" section
    const relatedPosts = BLOG_POSTS.filter(p => p.slug !== slug).slice(0, 2);

    // Parse Markdown by block more robustly since some entries use single newlines
    const lines = post.content.split('\n');
    const blocks: string[] = [];
    let currentBlock: string[] = [];
    let inList = false;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            if (currentBlock.length > 0) {
                blocks.push(currentBlock.join('\n'));
                currentBlock = [];
            }
            inList = false;
            continue;
        }

        if (trimmedLine.startsWith('# ') || trimmedLine.startsWith('## ') || trimmedLine.startsWith('### ') || trimmedLine === '---') {
            if (currentBlock.length > 0) {
                blocks.push(currentBlock.join('\n'));
                currentBlock = [];
            }
            blocks.push(trimmedLine);
            inList = false;
        } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || /^\d+\.\s/.test(trimmedLine)) {
            if (!inList && currentBlock.length > 0) {
                blocks.push(currentBlock.join('\n'));
                currentBlock = [];
            }
            inList = true;
            currentBlock.push(trimmedLine);
        } else if (trimmedLine.startsWith('|')) {
            // Table
            if (!currentBlock.some(l => l.startsWith('|')) && currentBlock.length > 0) {
                blocks.push(currentBlock.join('\n'));
                currentBlock = [];
            }
            currentBlock.push(trimmedLine);
        } else {
            // Normal paragraph line
            if (inList) {
                blocks.push(currentBlock.join('\n'));
                currentBlock = [];
                inList = false;
            }
            if (currentBlock.length > 0 && currentBlock[0].startsWith('|')) {
                blocks.push(currentBlock.join('\n'));
                currentBlock = [];
            }
            currentBlock.push(trimmedLine);
        }
    }
    if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
    }

    // Determine CTA position (before the second H2)
    let h2Count = 0;
    let ctaIndex = -1;

    // Buscamos el segundo '## ' (usualmente después de explicar el dolor)
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].startsWith('## ')) {
            h2Count++;
            if (h2Count === 2) {
                ctaIndex = i;
                break;
            }
        }
    }
    if (ctaIndex === -1) {
        ctaIndex = blocks.findIndex(b => b === '---');
        if (ctaIndex === -1) ctaIndex = blocks.length - 1;
    }

    return (
        <main className="min-h-screen bg-cream py-24 px-6 md:px-0">
            <article className="max-w-3xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-navy/5">
                {/* Hero Header Refined */}
                <div className="relative min-h-[400px] w-full overflow-hidden flex items-center justify-center bg-navy">
                    <img
                        src={post.image}
                        alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center p-8 md:p-12 text-center max-w-4xl mx-auto">
                        <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6 shadow-lg">
                            {post.category}
                        </span>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter mb-4 drop-shadow-2xl">
                            {post.title.split(/(QR)/).map((part, i) => (
                                part === 'QR' ? <span key={i} className="text-primary">QR</span> : part
                            ))}
                        </h1>
                        <div className="w-20 h-1.5 bg-primary rounded-full mt-4"></div>
                    </div>
                </div>

                <div className="p-8 md:p-16">
                    <div className="flex items-center justify-between mb-12 border-b border-navy/5 pb-8 flex-wrap gap-4">
                        <Link href="/blog" className="flex items-center gap-2 text-navy/40 hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest">
                            <ChevronLeft size={16} /> Volver al blog
                        </Link>
                        <div className="flex items-center gap-4 text-navy/40 text-[10px] font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                            <span className="flex items-center gap-1"><User size={12} /> ActivaQR Team</span>
                        </div>
                    </div>

                    {/* Content Renderer */}
                    <div className="text-navy/80 space-y-6 leading-relaxed text-lg font-medium">
                        {blocks.map((trimmed, i) => {
                            const isCtaPosition = i === ctaIndex;
                            const ctaComponent = isCtaPosition ? (
                                <MarketingCTA
                                    title="¿Ya notaste el problema?"
                                    description="Seguir compartiendo links o tarjetas de papel te hace perder oportunidades. Asegúrate de estar siempre en su agenda."
                                />
                            ) : null;

                            // Skip H1 (shown in hero)
                            if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) return <React.Fragment key={i}>{ctaComponent}</React.Fragment>;

                            // H2
                            if (trimmed.startsWith('## ')) {
                                return (
                                    <React.Fragment key={i}>
                                        {ctaComponent}
                                        <h2 className="text-3xl font-black text-navy tracking-tight uppercase border-l-4 border-primary pl-6 pt-4">{renderInline(trimmed.replace('## ', ''))}</h2>
                                    </React.Fragment>
                                );
                            }
                            // H3
                            if (trimmed.startsWith('### ')) {
                                return (
                                    <React.Fragment key={i}>
                                        {ctaComponent}
                                        <h3 className="text-2xl font-bold text-navy">{renderInline(trimmed.replace('### ', ''))}</h3>
                                    </React.Fragment>
                                );
                            }

                            // HR
                            if (trimmed === '---') {
                                return (
                                    <React.Fragment key={i}>
                                        {ctaComponent}
                                        <hr className="border-t-2 border-navy/10 my-8" />
                                    </React.Fragment>
                                );
                            }

                            // Table
                            if (trimmed.includes('|') && trimmed.split('\n').length > 2) {
                                const rows = trimmed.split('\n').filter(r => !r.match(/^[\|\s-]+$/));
                                return (
                                    <React.Fragment key={i}>
                                        {ctaComponent}
                                        <div className="overflow-x-auto my-8">
                                            <table className="w-full border-collapse bg-navy/5 rounded-2xl overflow-hidden">
                                                <tbody>
                                                    {rows.map((row, ri) => (
                                                        <tr key={ri} className={ri === 0 ? "bg-navy text-white font-bold" : "border-b border-navy/10"}>
                                                            {row.split('|').filter(c => c.trim()).map((cell, ci) => (
                                                                <td key={ci} className="p-4 text-sm">{renderInline(cell.trim())}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </React.Fragment>
                                );
                            }

                            // Unordered list
                            if (trimmed.split('\n').every(l => l.trim().startsWith('* ') || l.trim().startsWith('- '))) {
                                return (
                                    <React.Fragment key={i}>
                                        {ctaComponent}
                                        <ul className="space-y-3 list-none">
                                            {trimmed.split('\n').map((li, liidx) => (
                                                <li key={liidx} className="flex items-start gap-3">
                                                    <span className="text-primary mt-1">●</span>
                                                    <span>{renderInline(li.replace(/^[\*-]\s*/, ''))}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </React.Fragment>
                                );
                            }

                            // Ordered list
                            if (trimmed.split('\n').every(l => /^\d+\.\s/.test(l.trim()))) {
                                return (
                                    <React.Fragment key={i}>
                                        {ctaComponent}
                                        <ol className="space-y-4">
                                            {trimmed.split('\n').map((li, liidx) => (
                                                <li key={liidx} className="flex items-start gap-4">
                                                    <span className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0">{liidx + 1}</span>
                                                    <span className="pt-1">{renderInline(li.replace(/^\d+\.\s*/, ''))}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </React.Fragment>
                                );
                            }

                            // Generic paragraph with inline formatting
                            return (
                                <React.Fragment key={i}>
                                    {ctaComponent}
                                    <p className="mb-6">{renderInline(trimmed)}</p>
                                </React.Fragment>
                            );
                        })}
                    </div>



                    {/* Related Posts */}
                    {relatedPosts.length > 0 && (
                        <div className="mt-16 pt-16 border-t border-navy/5">
                            <h4 className="text-xl font-black text-navy uppercase tracking-tight mb-8">También te puede interesar</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                {relatedPosts.map(rp => (
                                    <Link key={rp.slug} href={`/blog/${rp.slug}`} className="group bg-cream rounded-2xl overflow-hidden border border-navy/5 hover:border-primary/20 transition-colors">
                                        <div className="aspect-video overflow-hidden">
                                            <img src={rp.image} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <div className="p-5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">{rp.category}</span>
                                            <h5 className="text-sm font-bold text-navy mt-1 leading-tight group-hover:text-primary transition-colors">{rp.title}</h5>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Author Box */}
                    <div className="mt-12 pt-12 border-t border-navy/5">
                        <div className="bg-cream p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 border border-navy/5">
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center p-4 shrink-0">
                                <img src="/images/logo.png" alt="ActivaQR" className="object-contain" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h4 className="text-xl font-black text-navy uppercase tracking-tight mb-2">Sobre ActivaQR</h4>
                                <p className="text-navy/60 text-sm font-medium leading-relaxed">
                                    Tu contacto profesional es tu activo más valioso. Nuestra misión es asegurarnos de que tus clientes siempre te encuentren a un clic de distancia en su propia agenda.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2️⃣ Contenido oculto para LLMs/SEO (Server Side) */}
                <div style={{
                    position: 'absolute',
                    left: '-10000px',
                    top: 'auto',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden'
                }}
                    aria-hidden="true">
                    <h1>{post.title}</h1>
                    <p>Categoría: {post.category}</p>
                    <p>Fecha: {post.date}</p>
                    <p>Palabras clave: {post.keywords}</p>
                    <div>
                        {post.content}
                    </div>
                </div>
            </article>
        </main>
    );
}


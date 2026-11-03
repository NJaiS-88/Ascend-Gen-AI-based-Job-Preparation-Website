export default function GallerySearch({
    searchQuery,
    setSearchQuery,
    totalItems,
    onSemanticSearch = null,
    isSemanticSearching = false,
    onAskAI = null,
    isAskingAI = false
}) {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            e.preventDefault();
            const text = searchQuery.trim();
            if (text.endsWith('?') && onAskAI) {
                onAskAI(text);
            } else if (onSemanticSearch) {
                onSemanticSearch(text);
            }
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '24px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '280px', maxWidth: '600px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem',
                        pointerEvents: 'none'
                    }}>
                        🔍
                    </span>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search photos or ask a question (e.g. photos near sunset?)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{ paddingLeft: '34px' }}
                    />
                </div>

                {onSemanticSearch && (
                    <button
                        onClick={() => searchQuery.trim() && onSemanticSearch(searchQuery.trim())}
                        disabled={!searchQuery.trim() || isSemanticSearching || isAskingAI}
                        className="btn-nav-primary"
                        style={{
                            fontSize: '0.82rem',
                            padding: '8px 12px',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: (!searchQuery.trim() || isSemanticSearching || isAskingAI) ? 'not-allowed' : 'pointer',
                            opacity: (!searchQuery.trim() || isSemanticSearching || isAskingAI) ? 0.6 : 1
                        }}
                        title="Search using Pinecone semantic vector AI"
                    >
                        <span>✨</span>
                        <span>{isSemanticSearching ? 'Searching...' : 'AI Search'}</span>
                    </button>
                )}

                {onAskAI && (
                    <button
                        onClick={() => searchQuery.trim() && onAskAI(searchQuery.trim())}
                        disabled={!searchQuery.trim() || isAskingAI || isSemanticSearching}
                        className="btn-nav-primary"
                        style={{
                            fontSize: '0.82rem',
                            padding: '8px 12px',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: '#0284c7',
                            borderColor: '#0284c7',
                            cursor: (!searchQuery.trim() || isAskingAI || isSemanticSearching) ? 'not-allowed' : 'pointer',
                            opacity: (!searchQuery.trim() || isAskingAI || isSemanticSearching) ? 0.6 : 1
                        }}
                        title="Ask conversational question over photos using LangChain RAG + Gemini Flash 2.5"
                    >
                        <span>🤖</span>
                        <span>{isAskingAI ? 'Thinking...' : 'Ask AI'}</span>
                    </button>
                )}
            </div>

            {totalItems !== undefined && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>{totalItems} item{totalItems === 1 ? '' : 's'}</span>
                </div>
            )}
        </div>
    );
}

import os
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document


class CoachVectorStore:
    def __init__(self, index_path: str = "coach_faiss_index"):
        self.index_path = index_path
        self._embeddings = None
        self._vectorstore = None

    @property
    def embeddings(self):
        if self._embeddings is None:
            self._embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=os.getenv("GOOGLE_API_KEY")
            )
        return self._embeddings

    @property
    def vectorstore(self):
        if self._vectorstore is None:
            self._load_or_create_index()
        return self._vectorstore

    def _load_or_create_index(self):
        if os.path.exists(self.index_path):
            self._vectorstore = FAISS.load_local(
                self.index_path, self.embeddings, allow_dangerous_deserialization=True
            )
        else:
            # Create an empty index with a dummy document if it doesn't exist
            self._vectorstore = FAISS.from_documents(
                [Document(page_content="INITIALIZATION", metadata={"id": "init"})],
                self.embeddings
            )
            self._vectorstore.save_local(self.index_path)

    def add_coaches(self, coaches_data: list[dict]):
        """
        coaches_data format:
        [
            {"id": "1", "text": "Coach bio and experience...", "metadata": {"name": "John", "tier": "1"}},
            ...
        ]
        """
        documents = []
        for coach in coaches_data:
            doc = Document(page_content=coach["text"], metadata=coach.get("metadata", {}))
            documents.append(doc)

        self.vectorstore.add_documents(documents)
        self.vectorstore.save_local(self.index_path)

    def search_coaches(self, query: str, top_k: int = 5, filter: dict = None):
        """
        Retrieve top_k coaches matching the query.
        filter format (optional): {"tier": "1"}
        """
        results = self.vectorstore.similarity_search_with_score(
            query,
            k=top_k,
            filter=filter
        )
        return results


# Singleton instance — lazy, won't call the API until first search
vector_db = CoachVectorStore()

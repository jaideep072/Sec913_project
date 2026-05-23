package mth.bootstrap;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import mth.models.Resource;
import mth.models.Section;
import mth.models.Users;
import mth.repository.ResourceRepository;
import mth.repository.SectionRepository;
import mth.repository.UsersRepository;

/**
 * Idempotent first-run seed: creates the 5 STEM core sections
 * (Physics, Mathematics, Computer Science, Biology, Finance)
 * and drops in example papers from real arXiv-like topics so a
 * fresh database isn't empty.
 *
 * Safe to keep enabled forever — every step is "create if missing".
 */
@Component
public class DataSeeder implements CommandLineRunner {

	private final SectionRepository sectionRepo;
	private final ResourceRepository resourceRepo;
	private final UsersRepository usersRepo;

	public DataSeeder(SectionRepository sectionRepo,
			ResourceRepository resourceRepo,
			UsersRepository usersRepo) {
		this.sectionRepo = sectionRepo;
		this.resourceRepo = resourceRepo;
		this.usersRepo = usersRepo;
	}

	@Override
	public void run(String... args) {
		seedAdminUser();

		seedSection("physics", "Physics",
				"From quantum mechanics to cosmology — fundamental laws of the universe.");
		seedSection("mathematics", "Mathematics",
				"Pure and applied mathematics: algebra, calculus, topology, and more.");
		seedSection("cs", "Computer Science",
				"Algorithms, machine learning, systems, and theoretical CS.");
		seedSection("biology", "Biology",
				"Genetics, evolution, molecular biology, and life sciences.");
		seedSection("finance", "Finance",
				"Markets, econometrics, quantitative finance, and economic theory.");

		if (resourceRepo.count() == 0) {
			seedSampleResources();
		}
	}

	/**
	 * Pre-creates the single Admin account so it exists on first boot.
	 * Idempotent: if a row with this email already exists, it's left alone
	 * (so an admin can change their own password later without it being reset).
	 */
	private void seedAdminUser() {
		String adminEmail = "reachsainikhil@gmail.com";
		if (usersRepo.existsByEmail(adminEmail)) return;

		Users admin = new Users();
		admin.setFullname("Sai Nikhil (Admin)");
		admin.setPhone("");
		admin.setEmail(adminEmail);
		admin.setPassword("Sainikhil@1");   // plain text to match existing pattern
		admin.setRole("Admin");
		admin.setStatus(1);
		usersRepo.save(admin);
	}

	private void seedSection(String id, String name, String description) {
		if (sectionRepo.existsById(id)) return;
		Section s = new Section();
		s.setId(id);
		s.setName(name);
		s.setDescription(description);
		s.setCore(true);
		sectionRepo.save(s);
	}

	private void seedSampleResources() {
		// ── Physics ──
		Resource quantum = new Resource();
		quantum.setSectionId("physics");
		quantum.setTitle("Quantum Entanglement and Bell's Theorem");
		quantum.setAuthor("John S. Bell");
		quantum.setYear(1964);
		quantum.setDifficulty("Advanced");
		quantum.setSummary("Bell's theorem shows that quantum mechanics is incompatible with local hidden-variable theories. "
				+ "This paper formalizes the famous Bell inequalities and their experimental consequences.");
		quantum.setBody("Bell's theorem demonstrates that if quantum mechanics is correct, nature is non-local: "
				+ "measurements on entangled particles instantaneously affect each other regardless of distance. "
				+ "This paper derives the CHSH inequality and shows how experimental violations rule out "
				+ "local realism. The result is foundational to quantum computing, quantum cryptography, "
				+ "and our understanding of reality at the most fundamental level.");
		quantum.setKeyQuote("\"Correlations cry out for explanation.\" — John S. Bell");
		quantum.setWhyStudy("Quantum entanglement is the most non-classical feature of quantum theory and the "
				+ "basis for emerging technologies like quantum computing and quantum cryptography.");
		quantum.setTags(List.of("quantum mechanics", "entanglement", "bell inequality", "foundations"));
		quantum.setKeyThemes(List.of("Non-locality", "Hidden variables", "Quantum correlations", "Causality"));
		quantum.setKeyFacts(List.of(
				"Bell's theorem was called \"the most profound discovery of science\" by physicist Henry Stapp",
				"Experimental violations of Bell inequalities were first confirmed by Alain Aspect in 1982",
				"The 2022 Nobel Prize in Physics was awarded for Bell-inequality experiments"));
		quantum.setRelatedTopics(List.of("Quantum Computing", "Quantum Cryptography", "Decoherence", "EPR Paradox"));
		quantum.setPublished(true);
		resourceRepo.save(quantum);

		// ── Mathematics ──
		Resource primeNumber = new Resource();
		primeNumber.setSectionId("mathematics");
		primeNumber.setTitle("The Riemann Hypothesis and Prime Number Distribution");
		primeNumber.setAuthor("Bernhard Riemann");
		primeNumber.setYear(1859);
		primeNumber.setDifficulty("Advanced");
		primeNumber.setSummary("Riemann's seminal paper connecting the distribution of prime numbers to the zeros "
				+ "of the Riemann zeta function — one of the seven Millennium Prize Problems.");
		primeNumber.setBody("In his only paper on number theory, Riemann introduced the zeta function ζ(s) and "
				+ "conjectured that all non-trivial zeros lie on the critical line Re(s)=1/2. The Riemann Hypothesis, "
				+ "if proven, would give precise bounds on prime gaps and revolutionize our understanding of prime "
				+ "number distribution. This paper remains one of the most important open problems in mathematics.");
		primeNumber.setWhyStudy("The Riemann Hypothesis is the holy grail of number theory with deep implications "
				+ "for cryptography, algorithm analysis, and the very structure of integers.");
		primeNumber.setTags(List.of("number theory", "riemann hypothesis", "prime numbers", "zeta function"));
		primeNumber.setKeyThemes(List.of("Analytic number theory", "Prime distribution", "Complex analysis", "Millennium problem"));
		primeNumber.setKeyFacts(List.of(
				"The Riemann Hypothesis is one of the Clay Mathematics Institute's seven Millennium Prize Problems ($1M prize)",
				"Over 10 trillion zeros have been verified numerically — all on the critical line",
				"Many important theorems are proven \"assuming the Riemann Hypothesis\""));
		primeNumber.setRelatedTopics(List.of("Prime Number Theorem", "L-functions", "Cryptography", "Analytic Number Theory"));
		primeNumber.setPublished(true);
		resourceRepo.save(primeNumber);

		// ── Computer Science ──
		Resource transformer = new Resource();
		transformer.setSectionId("cs");
		transformer.setTitle("\"Attention Is All You Need\" — The Transformer Architecture");
		transformer.setAuthor("Vaswani et al.");
		transformer.setYear(2017);
		transformer.setDifficulty("Advanced");
		transformer.setSummary("The seminal paper introducing the Transformer model, which replaced recurrent "
				+ "neural networks with a novel attention mechanism and became the foundation of modern LLMs.");
		transformer.setBody("This paper introduced the Transformer architecture, which relies entirely on "
				+ "self-attention mechanisms without recurrence or convolution. The key innovation is multi-head "
				+ "attention combined with positional encodings, enabling parallelization and superior performance "
				+ "on translation tasks. This architecture is the basis for GPT, BERT, and virtually all modern "
				+ "large language models.");
		transformer.setKeyQuote("\"The Transformer is the first transduction model relying entirely on self-attention.\"");
		transformer.setWhyStudy("The Transformer architecture revolutionized NLP and now powers ChatGPT, Claude, "
				+ "and most state-of-the-art AI systems. Understanding it is essential for modern ML.");
		transformer.setTags(List.of("deep learning", "transformer", "attention", "NLP", "LLM"));
		transformer.setKeyThemes(List.of("Self-attention", "Multi-head attention", "Positional encoding", "Sequence transduction"));
		transformer.setKeyFacts(List.of(
				"The paper has been cited over 100,000 times — one of the most cited ML papers ever",
				"Transformers train 3-5x faster than recurrent alternatives",
				"The 'Transformer' name comes from the absence of recurrence — it transforms sequences in one pass"));
		transformer.setRelatedTopics(List.of("Large Language Models", "GPT", "BERT", "Neural Machine Translation"));
		transformer.setPublished(true);
		resourceRepo.save(transformer);

		// ── Biology ──
		Resource crispr = new Resource();
		crispr.setSectionId("biology");
		crispr.setTitle("CRISPR-Cas9: A Programmable Genome-Editing Tool");
		crispr.setAuthor("Jinek, Doudna, Charpentier et al.");
		crispr.setYear(2012);
		crispr.setDifficulty("Advanced");
		crispr.setSummary("The landmark paper demonstrating that the CRISPR-Cas9 system can be programmed to "
				+ "cut specific DNA sequences, launching the genome-editing revolution.");
		crispr.setBody("This paper showed that the Cas9 endonuclease can be guided by a single guide RNA (sgRNA) "
				+ "to introduce double-strand breaks at precise genomic locations. The system is remarkably simple, "
				+ "efficient, and programmable — making genome editing accessible to any molecular biology lab. "
				+ "CRISPR has since been applied to gene therapy, agriculture, and fundamental research.");
		crispr.setWhyStudy("CRISPR-Cas9 won the 2020 Nobel Prize in Chemistry and is transforming medicine, "
				+ "agriculture, and our ability to understand the genome.");
		crispr.setTags(List.of("crispr", "genome editing", "cas9", "molecular biology", "gene therapy"));
		crispr.setKeyThemes(List.of("Genome editing", "RNA-guided endonuclease", "Gene therapy", "Biotechnology"));
		crispr.setKeyFacts(List.of(
				"Doudna and Charpentier won the Nobel Prize in Chemistry in 2020 for this discovery",
				"CRISPR sequences were originally discovered in bacteria as an immune system",
				"Clinical trials using CRISPR for sickle cell disease have shown remarkable success"));
		crispr.setRelatedTopics(List.of("Gene Therapy", "Stem Cells", "Epigenetics", "Synthetic Biology"));
		crispr.setPublished(true);
		resourceRepo.save(crispr);

		// ── Finance ──
		Resource blackScholes = new Resource();
		blackScholes.setSectionId("finance");
		blackScholes.setTitle("The Pricing of Options and Corporate Liabilities (Black-Scholes)");
		blackScholes.setAuthor("Fischer Black, Myron Scholes");
		blackScholes.setYear(1973);
		blackScholes.setDifficulty("Advanced");
		blackScholes.setSummary("The revolutionary paper that derived the Black-Scholes option pricing formula, "
				+ "transforming financial markets and winning the 1997 Nobel Prize in Economics.");
		blackScholes.setBody("This paper derived a partial differential equation (the Black-Scholes equation) that "
				+ "must be satisfied by any derivative security. The solution — the Black-Scholes formula — gives "
				+ "the fair price of a European call or put option. Key assumptions include continuous trading, "
				+ "no transaction costs, and lognormal stock prices. The model created the modern derivatives "
				+ "market and sparked the field of quantitative finance.");
		blackScholes.setWhyStudy("The Black-Scholes model is the foundation of modern finance. Every quantitative "
				+ "analyst, risk manager, and trader must understand it.");
		blackScholes.setTags(List.of("options", "derivatives", "pricing", "quantitative finance"));
		blackScholes.setKeyThemes(List.of("Risk-neutral pricing", "Stochastic calculus", "Hedging", "Market efficiency"));
		blackScholes.setKeyFacts(List.of(
				"The formula won the 1997 Nobel Prize in Economics (Black had passed away)",
				"The Chicago Board Options Exchange opened the same year (1973), co-creating the options market",
				"The model assumes constant volatility — a limitation that led to the volatility smile discovery"));
		blackScholes.setRelatedTopics(List.of("Stochastic Calculus", "Risk Management", "Derivatives Markets", "Volatility Modeling"));
		blackScholes.setPublished(true);
		resourceRepo.save(blackScholes);
	}
}

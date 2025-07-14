**FocalRouter**

FocalRouter is a fully client-side, open-source, browser-based playground for experimenting with LLM model-routing strategies, costs, and accuracy across multiple LLM providers.

FocalRouter is hosted at https://focalrouter.com.

**UI Tour**

Left panel (toggle « / »)
* Save API keys
* Build routing pipeline (add / remove / ↑ ↓)
* Every pipeline is validated (filter* → rank* → decide*)

Chat window (center)
* Try questions live
* Click the (model) tag under any assistant reply to see every routing step

Right panel (toggle « / »)
* Run sampled MMLU benchmarks
* Choose seed & sample size (CSV in public/testdata/mmlu.csv)
* Shows accuracy, real cost, GPT-4o counter-cost, and savings
* Maintains a top-3 leaderboard in localStorage

**Routing pipeline building blocks**
| `cat`      | `id`         | Role & math                                                                                                               |
| ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **filter** | `classifier` | Basic regex task tagger (no pruning)                                                                                      |
|            | `complexity` | Drops models with IQ < 0.40 or context < 2×prompt when the prompt looks **hard** `(length > 240 ∨ code/proof math regex)` |
| **rank**   | `score`      | Quality-price ratio: keep top ½ (≥ 3) by `IQ / price`                                                                     |
|            | `bandit`     | Thompson-sampling bandit; keeps a top-N shortlist that improves over time (stats cached per-tab in `localStorage`)        |
| **decide** | `pareto`     | Finds knee-point on the Pareto frontier `(price, IQ)` via scalarization λ = 0.6                                           |
|            | `thrift`     | Mimics Anthropic *ThriftLLM*: chooses **cheapest** model whose IQ ≥ 95 % of the best remaining                            |
|            | `llm`        | LLM-based router (calls `mistral-small-latest`) if you provided a Mistral key                                             |
|            | `cheapest`   | Final fallback: lowest blended price                                                                                      |

**Cost tracing**

Each benchmark call computes

~~~
actual     = tokens × chosenModelPrice / 1M
gpt4oCost  = tokens × GPT-4o-price     / 1M
savings    = gpt4oCost – actual
~~~
Tokens are estimated as ```(prompt + reply) / 4.```

A summary line prints at the end, e.g.

```Cost: $0.0023 | GPT-4o baseline $0.0092 | Savings $0.0069 (75%)```

**Editing the Model Registry**

```src/utils/modelRegistry.ts``` lists every model:

~~~
{
  name: "gemini-2.5-pro-latest",
  provider: "google",
  contextSize: 2_000_000,
  inputPricePerMillion: 1.25,
  outputPricePerMillion: 5.0,
  intelligenceScore: 0.52
}
~~~
price is per-million tokens (interactive rates).

```intelligenceScore``` is a heuristic 0-1 ranking; higher = smarter.

Free OSS checkpoints (Mistral 7B etc.) have price 0.

**Contributing ideas**

New routing layers are just:

Add ```{ id, label, cat }``` to ```STEP_CATALOG```.

Implement the algorithm in ```routeAlgorithms.ts```.

Extend the ```chooseBestModelForPrompt``` switch.

The UI will auto-expose the layer in “Add” buttons without additional work.
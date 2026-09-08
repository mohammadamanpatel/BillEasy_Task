## AI-assisted thinking and development

I did not start this project by asking AI to build an app.

The main purpose of using AI for this assignment was not simply to put an LLM like Gemini inside the application. The more interesting part for me was using AI as a thinking and brainstorming partner while deciding what to build, why to build it, and how to build it.

I first spent time understanding the problem and asking questions before writing the first line of code.

### How I came up with the idea

I first tried to understand the problem with offers:

- Why do businesses give discounts?
- What makes an offer good or bad?
- Is getting more customers always a good thing?
- Can an offer bring more sales but still lose money?
- What happens when a discount is too high?
- Is an offer still good if the business makes only a very small profit?
- What should a shop owner know before giving a discount?
- Should the owner fill in many details, or should they simply ask the question in their own words?

Then I looked at what Billeasy already does and tried to understand how my idea could be different.

Billeasy already works with digital bills, customer behaviour, offers, loyalty, feedback and business information.

This made me ask:

> Am I just building a smaller version of Billeasy?

I did not want to do that, so I challenged the idea and looked at other problems too.

One idea I explored was understanding customer feedback and comments. I then asked:

> Is this really different, or do other platforms already do something similar?

After comparing these ideas, I came back to the problem of discounts and profit.

Billeasy publicly talks about customer behaviour, personalised offers, promotions and business information. I did not find public information showing a system that specifically checks an offer against the product's cost and profit.

That led me to the final idea: Offer Sensei.

### The final idea

The main question became:

> "Should you give this offer?"

Instead of simply creating a discount, Offer Sensei checks whether the business can afford that discount.

For example:

> "Give 20% off on milk to inactive customers."

The AI understands what the owner is asking.

Then the backend gets the actual product price and cost and does the math:

1. Find the product.
2. Get its selling price and cost price.
3. Calculate the discount.
4. Calculate the new selling price.
5. Calculate the new profit.
6. Give a result: GOOD, RISKY or LOSS.

After that, AI explains the result in simple words and can suggest a better option.

### AI tools I used

| Tool | How I used it |
|---|---|
| ChatGPT | Thinking through the problem, brainstorming ideas, asking questions, challenging my assumptions, comparing different ideas, planning the app, thinking about the database, finding possible problems and reviewing decisions |
| OpenCode | Generating code, making changes, improving the code, fixing problems and helping turn the plan into a working application |
| Google Gemini | Used inside the app to understand what the shop owner is asking, explain the result and suggest other options |

### AI was more than just the LLM inside the app

Using Gemini inside the application was not the main objective of this assignment.

I could have built the same core idea without an LLM. The important part was exploring:

> What can I actually do when I use AI as a thinking partner from the beginning of a project?

ChatGPT helped me go back and forth on the idea instead of accepting the first idea that came to mind.

For example, I used it to:

- Challenge whether the problem was worth solving.
- Question whether I was simply copying something Billeasy already does.
- Explore completely different ideas.
- Compare those ideas with existing products.
- Think about what the actual user would need.
- Decide which parts should use AI and which parts should not.
- Think through possible problems before coding.
- Simplify the first version instead of adding unnecessary features.

This changed the project before any code was written.

### One important decision

One of the most important decisions I made was:

> AI can suggest. The backend must prove.

I did not let AI calculate the prices or profits.

AI is used to understand the owner's question and explain the result.

The backend does all the money calculations.

For example, if the AI says the profit is Rs 10, the app does not simply trust it. The backend calculates the profit itself using the actual product price and cost.

This makes the result safer and easier to check.

### How AI helped me build it

I used AI in two main stages.

Before coding:

- Understand the problem
- Ask questions about the idea
- Explore different ideas
- Check if the idea was already being solved
- Challenge my own assumptions
- Decide what the app should and should not do
- Plan how the app should work
- Think about possible problems

While coding:

- Generate code
- Make changes to the code
- Improve the code
- Find and fix problems
- Think of different ways to build a feature
- Test different cases

I did not simply take everything AI suggested.

I checked the suggestions, changed them when needed, and made the final decisions myself.

The goal was not to build the biggest AI application possible. The goal was to see how much better the idea and development process could become by using AI to think, question and build alongside me.
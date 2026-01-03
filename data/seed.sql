-- Insert Books (IDs will be auto-generated starting at 1)
INSERT INTO nodes (id, title, author, genre, year) VALUES 
(1, 'Hackers & Painters', 'Paul Graham', 'Essays/Computer Science', 2004),
(2, 'The Mythical Man-Month', 'Fred Brooks', 'Software Engineering', 1975),
(3, 'Structure and Interpretation of Computer Programs', 'Abelson & Sussman', 'Computer Science', 1984),
(4, 'On Lisp', 'Paul Graham', 'Programming', 1993),
(5, 'ANSI Common Lisp', 'Paul Graham', 'Programming', 1995),
(6, 'Design Patterns', 'Gang of Four', 'Software Engineering', 1994),
(7, 'Gödel, Escher, Bach', 'Douglas Hofstadter', 'Philosophy/Mathematics', 1979),
(8, 'The Lean Startup', 'Eric Ries', 'Business', 2011),
(9, 'Zero to One', 'Peter Thiel', 'Business', 2014),
(10, 'The Pragmatic Programmer', 'Hunt & Thomas', 'Software Engineering', 1999),
(11, 'The C Programming Language', 'Kernighan & Ritchie', 'Programming', 1978),
(12, 'The Human Condition', 'Hannah Arendt', 'Political Philosophy', 1958),
(13, 'The Origins of Totalitarianism', 'Hannah Arendt', 'Political Philosophy', 1951),
(14, 'Nicomachean Ethics', 'Aristotle', 'Philosophy', -340),
(15, 'Das Kapital', 'Karl Marx', 'Economics/Philosophy', 1867),
(16, 'Leviathan', 'Thomas Hobbes', 'Political Philosophy', 1651),
(17, 'Being and Time', 'Martin Heidegger', 'Phenomenology', 1927),
(18, 'The Prince', 'Niccolò Machiavelli', 'Political Theory', 1532);

-- Insert Links (referencing the integer IDs above)
INSERT INTO links (source_id, target_id, quote, sentiment) VALUES
-- Paul Graham Cluster
(1, 2, "Brooks' law is the most important single heuristic in software engineering...", 'recommended'),
(1, 3, "If you want to understand how computers really work, you need to read the wizard book...", 'recommended'),
(1, 4, "Lisp is different. It's not just a language, it's a building material...", 'neutral'),
(1, 6, "When I see patterns in my programs, I consider it a sign of trouble...", 'critiqued'),
(3, 7, "Hofstadter's exploration of recursion and strange loops mirrors the fundamental structures...", 'recommended'),
(9, 1, "Graham's essays on startups were fundamental to the Y Combinator philosophy...", 'recommended'),
(10, 2, "We still struggle with the same communication problems Brooks identified decades ago.", 'neutral'),
(11, 2, "System programming requires the discipline discussed by Brooks.", 'neutral'),
(1, 5, "Common Lisp is a big language, but it's the industrial strength version...", 'neutral'),
(8, 1, "The 'make something people want' mantra is the bedrock of modern product development.", 'recommended'),

-- Hannah Arendt Cluster
(12, 15, "Marx's fundamental error was the glorification of labor...", 'critiqued'),
(12, 14, "The distinction between labor, work, and action draws heavily on Aristotle...", 'recommended'),
(12, 13, "While Origins analyzed the destruction of the public sphere...", 'neutral'),
(12, 17, "Arendt applies Heideggerian phenomenology to the public realm...", 'neutral'),
(12, 16, "Hobbes's commonwealth constructs a sovereignty that destroys the possibility of genuine political action...", 'critiqued'),
(18, 12, "Machiavelli's instrumentalization of action is exactly what Arendt warns against...", 'critiqued');
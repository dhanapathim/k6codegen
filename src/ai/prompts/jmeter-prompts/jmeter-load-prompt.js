export const JMeterTemplate = `
Generate Java code using the following data:
Swagger JSON:
{swaggerJson}
User-selected Swagger paths:
{swaggerPaths}
Thread Group configuration:
{threadGroups}
Iteration definition:
{iteration_definition}

Use this load plan:

{threadGroups}

Generate Java code identical in style and structure to the example I provided.

package org.jmeter;;
import org.apache.jmeter.config.Arguments;
import org.apache.jmeter.control.LoopController;
import org.apache.jmeter.control.TransactionController;
import org.apache.jmeter.extractor.json.jsonpath.JSONPostProcessor;
import org.apache.jmeter.protocol.http.control.Header;
import org.apache.jmeter.protocol.http.control.HeaderManager;
import org.apache.jmeter.protocol.http.sampler.HTTPSamplerProxy;
import org.apache.jmeter.protocol.http.util.HTTPConstants;
import org.apache.jmeter.reporters.ResultCollector;
import org.apache.jmeter.reporters.Summariser;
import org.apache.jmeter.save.SaveService;
import org.apache.jmeter.testelement.TestElement;
import org.apache.jmeter.testelement.TestPlan;
import org.apache.jmeter.threads.ThreadGroup;
import org.apache.jmeter.util.JMeterUtils;
import org.apache.jorphan.collections.HashTree;
import org.apache.jorphan.collections.ListedHashTree;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Properties;

public class {outputFile} {{

    private static final String DOMAIN = "api.restful-api.dev";
    private static final String PROTOCOL = HTTPConstants.PROTOCOL_HTTPS;
    private static final String CONTENT_TYPE_JSON = "application/json";

    // Request body examples from Swagger 'NewObject' schema
    private static final String POST_OBJECT_BODY = "{{\n" +
            "  \"name\": \"Apple MacBook Pro 16\",\n" +
            "  \"data\": {{\n" +
            "    \"year\": 2023,\n" +
            "    \"price\": 2499.99,\n" +
            "    \"CPU model\": \"Apple M3 Max\",\n" +
            "    \"Hard disk size\": \"1 TB\"\n" +
            "  }}\n" +
            "}}";

    private static final String PUT_OBJECT_BODY = "{{\n" +
            "  \"name\": \"Updated Apple MacBook Pro 16 (M3 Max)\",\n" +
            "  \"data\": {{\n" +
            "    \"year\": 2024,\n" +
            "    \"price\": 2699.99,\n" +
            "    \"CPU model\": \"Apple M4 Max\",\n" +
            "    \"Hard disk size\": \"2 TB\"\n" +
            "  }}\n" +
            "}}";

    public static void main(String[] args) throws Exception {{

        // ────────────────────────────────────────
        // 1. JMeter Initialization
        // ────────────────────────────────────────
        // ------------------------------------------------------------
        Properties props = new Properties();
        props.load(new FileInputStream("gradle.properties"));

        String jmeterHome = props.getProperty("jmeterHome");
        String jmeterProperties = jmeterHome + "/bin/jmeter.properties";

        JMeterUtils.setJMeterHome(jmeterHome);
        JMeterUtils.loadJMeterProperties(jmeterProperties);
        JMeterUtils.initLocale();

        SaveService.loadProperties();


        // ────────────────────────────────────────
        // 2. Test Plan
        // ────────────────────────────────────────
        TestPlan testPlan = new TestPlan("RESTful API CRUD Test Plan - Scaled 50% 100% 200% 1000%");
        testPlan.setProperty(TestElement.GUI_CLASS, "TestPlanGui");
        testPlan.setProperty(TestElement.TEST_CLASS, TestPlan.class.getName());
        testPlan.setUserDefinedVariables(new Arguments());

        ListedHashTree testPlanTree = new ListedHashTree();
        HashTree testPlanHashTree = testPlanTree.add(testPlan);

        // ────────────────────────────────────────
        // 3. Thread Groups (using a builder method)
        // ────────────────────────────────────────

        // TG_50_percent
        ThreadGroup tg50Percent = createThreadGroup("TG_50_percent (6 users)", 6, 10, 50,0);
        HashTree tg50PercentTree = testPlanHashTree.add(tg50Percent);
        addCrudWorkflowToThreadGroup(tg50PercentTree);

        // TG_100_percent
        ThreadGroup tg100Percent = createThreadGroup("TG_100_percent (12 users)", 12, 10, 50,50);
        HashTree tg100PercentTree = testPlanHashTree.add(tg100Percent);
        addCrudWorkflowToThreadGroup(tg100PercentTree);

        // TG_200_percent
        ThreadGroup tg200Percent = createThreadGroup("TG_200_percent (24 users)", 24, 10, 50,100);
        HashTree tg200PercentTree = testPlanHashTree.add(tg200Percent);
        addCrudWorkflowToThreadGroup(tg200PercentTree);

        // TG_1000_percent
        ThreadGroup tg1000Percent = createThreadGroup("TG_1000_percent (120 users)", 120, 20, 50,150);
        HashTree tg1000PercentTree = testPlanHashTree.add(tg1000Percent);
        addCrudWorkflowToThreadGroup(tg1000PercentTree);

        // ────────────────────────────────────────
        // 5. Listeners (at Test Plan level – like your screenshot)
        // ────────────────────────────────────────
        addListenersToTestPlan(testPlanHashTree);

        // ────────────────────────────────────────
        // 6. Save JMX
        // ────────────────────────────────────────
        System.out.println("Saving JMeter Test Plan to CRUD_TestPlan.jmx...");
        File jmxFile = new File("{outputFile}.jmx");
        try (FileOutputStream out = new FileOutputStream(jmxFile)) {{
            SaveService.saveTree(testPlanTree, out);
            System.out.println("Test Plan saved successfully to " + jmxFile.getAbsolutePath());
}} catch (IOException e) {{
            System.err.println("Error saving Test Plan: " + e.getMessage());
}}
}}

    /**
     * Creates a ThreadGroup instance.
     */
    private static ThreadGroup createThreadGroup(String name, int users, int ramp, int duration,int strtup ) {{
        LoopController loopController = new LoopController();
        loopController.setLoops(-1);
        loopController.setContinueForever(true);
        loopController.setProperty(TestElement.GUI_CLASS, "LoopControlPanel");
        loopController.setProperty(TestElement.TEST_CLASS, LoopController.class.getName());
        loopController.initialize();

        ThreadGroup threadGroup = new ThreadGroup();
        threadGroup.setName(name);
        threadGroup.setNumThreads(users);
        threadGroup.setRampUp(ramp);
        threadGroup.setScheduler(true);
        threadGroup.setDuration(duration);
        threadGroup.setDelay(strtup);
        threadGroup.setSamplerController(loopController);

        threadGroup.setProperty(TestElement.GUI_CLASS, "ThreadGroupGui");
        threadGroup.setProperty(TestElement.TEST_CLASS, ThreadGroup.class.getName());

        return threadGroup;
}}

    /**
     * Creates an HTTPSamplerProxy instance.
     */
    private static HTTPSamplerProxy createSampler(String name,String domain,String path, String method, String requestBody,String contentType) {{
                                                                                        
        HTTPSamplerProxy sampler = new HTTPSamplerProxy();
        sampler.setName(name);
        sampler.setDomain(domain);
        sampler.setProtocol(PROTOCOL);
        sampler.setPath(path);
        sampler.setMethod(method);
        sampler.setFollowRedirects(true);
        sampler.setUseKeepAlive(true);
        sampler.setAutoRedirects(false);

        // Raw JSON body handling
        if (requestBody != null && !requestBody.isEmpty()
                && (HTTPConstants.POST.equals(method) || HTTPConstants.PUT.equals(method))) {{
            sampler.setPostBodyRaw(true);
            sampler.addNonEncodedArgument("", requestBody, "");
}}

        sampler.setProperty(TestElement.GUI_CLASS, "HttpTestSampleGui");
        sampler.setProperty(TestElement.TEST_CLASS, HTTPSamplerProxy.class.getName());
        return sampler;
}}

    /**
     * Creates a HeaderManager with Content-Type.
     */
    private static HeaderManager createHeaderManager(String contentType) {{
        HeaderManager headerManager = new HeaderManager();
        headerManager.setName("HTTP Header Manager");

        if (contentType != null && !contentType.isEmpty()) {{
            headerManager.add(new Header("Content-Type", contentType));
}}

        headerManager.setProperty(TestElement.GUI_CLASS, "HeaderPanel");
        headerManager.setProperty(TestElement.TEST_CLASS, HeaderManager.class.getName());
        return headerManager;
}}

    /**
     * Adds the CRUD workflow wrapped in a Transaction Controller to the given Thread Group tree.
     */
    private static void addCrudWorkflowToThreadGroup(HashTree threadGroupTree) {{

        TransactionController transactionController = new TransactionController();
        transactionController.setName("CRUD Workflow Transaction");
        transactionController.setGenerateParentSample(true);
        transactionController.setProperty(TestElement.GUI_CLASS, "TransactionControllerGui");
        transactionController.setProperty(TestElement.TEST_CLASS, TransactionController.class.getName());

        HashTree transactionControllerHashTree = threadGroupTree.add(transactionController);

        // 1. POST /objects - Create a new object
        HTTPSamplerProxy postSampler = createSampler(
                "1. Create Object (POST /objects)",
                DOMAIN,
                "/objects",
                HTTPConstants.POST,
                POST_OBJECT_BODY,
                CONTENT_TYPE_JSON
        );
        HashTree postSamplerTree = transactionControllerHashTree.add(postSampler);
        postSamplerTree.add(createHeaderManager(CONTENT_TYPE_JSON));

        JSONPostProcessor jsonExtractor = new JSONPostProcessor();
        jsonExtractor.setName("JSON Extractor - Object ID");
        jsonExtractor.setRefNames("OBJECT_ID");
        jsonExtractor.setJsonPathExpressions("$.id");
        jsonExtractor.setMatchNumbers("1");
        jsonExtractor.setDefaultValues("OBJECT_ID_NOT_FOUND");
        jsonExtractor.setProperty(TestElement.GUI_CLASS, "JSONPostProcessorGui");
        jsonExtractor.setProperty(TestElement.TEST_CLASS, JSONPostProcessor.class.getName());
        postSamplerTree.add(jsonExtractor);

      
        HTTPSamplerProxy getSampler = createSampler(
                "2. Get Object (GET /objects/{{id}})",
                DOMAIN,
                "/objects/{{OBJECT_ID}}",
                HTTPConstants.GET,
                null,
                null
        );
        transactionControllerHashTree.add(getSampler);

        HTTPSamplerProxy putSampler = createSampler(
                "3. Update Object (PUT /objects/{{id}})",
                DOMAIN,
                "/objects/{{OBJECT_ID}}",
                HTTPConstants.PUT,
                PUT_OBJECT_BODY,
                CONTENT_TYPE_JSON
        );
        HashTree putSamplerTree = transactionControllerHashTree.add(putSampler);
        putSamplerTree.add(createHeaderManager(CONTENT_TYPE_JSON));

       
        HTTPSamplerProxy deleteSampler = createSampler(
                "4. Delete Object (DELETE /objects/{{id}})",
                DOMAIN,
                "/objects/{{OBJECT_ID}}",
                HTTPConstants.DELETE,
                null,
                null
        );
        transactionControllerHashTree.add(deleteSampler);
}}

    /**
     * Adds standard listeners (Summary, Aggregate, View Results Tree)
     * at the Test Plan level (like your screenshot).
     */
    private static void addListenersToTestPlan(HashTree testPlanHashTree) {{

        // Summary Report
        Summariser summariser = new Summariser("summary");
        ResultCollector summaryReport = new ResultCollector(summariser);
        summaryReport.setName("Summary Report");
        summaryReport.setProperty(TestElement.GUI_CLASS, "SummaryReport");
        summaryReport.setProperty(TestElement.TEST_CLASS, ResultCollector.class.getName());
        testPlanHashTree.add(summaryReport);

        // Aggregate Report (Visualizer)
        ResultCollector aggregateReport = new ResultCollector();
        aggregateReport.setName("Visualizer");
        aggregateReport.setProperty(TestElement.GUI_CLASS, "StatVisualizer");
        aggregateReport.setProperty(TestElement.TEST_CLASS, ResultCollector.class.getName());
        testPlanHashTree.add(aggregateReport);

        // View Results Tree
        ResultCollector viewResultsTree = new ResultCollector();
        viewResultsTree.setName("ViewResultsFullVisualizer");
        viewResultsTree.setProperty(TestElement.GUI_CLASS, "ViewResultsFullVisualizer");
        viewResultsTree.setProperty(TestElement.TEST_CLASS, ResultCollector.class.getName());
        testPlanHashTree.add(viewResultsTree);
}}
}}`;

